import Foundation
import AdServices
import Mixpanel
import PostHog
import RevenueCat
import OSLog

/// Apple Search Ads Attribution Manager
/// Jake Mor #51: "Send keyword attribution to Mixpanel"
@MainActor
final class ASAAttributionManager {
    static let shared = ASAAttributionManager()
    private let logger = Logger(subsystem: "com.anicca.ios", category: "ASAAttribution")

    private let hasCheckedKey = "asa_attribution_checked"

    private init() {}

    /// 初回起動時にASAアトリビューションを取得してMixpanelに送信
    /// AppDelegate.didFinishLaunchingWithOptionsから呼び出す
    func fetchAttributionIfNeeded() async {
        // 既にチェック済みなら何もしない（初回のみ実行）
        guard !UserDefaults.standard.bool(forKey: hasCheckedKey) else {
            logger.debug("ASA attribution already checked, skipping")
            return
        }

        do {
            // Step 1: AdServicesからトークンを取得
            let token = try AAAttribution.attributionToken()
            logger.info("ASA attribution token obtained")

            // Step 2: AppleのAPIにトークンを送信してattribution情報を取得
            let attribution = try await fetchAttributionData(token: token)

            // Step 3: Mixpanelにユーザープロパティとして設定
            setMixpanelProperties(attribution: attribution)
            setPostHogProperties(attribution: attribution)

            // Apple が応答した時だけチェック済みにする（通信失敗は次回起動で再試行）
            UserDefaults.standard.set(true, forKey: hasCheckedKey)

        } catch {
            // ASA経由でないインストール（Organic）の場合はエラーになる
            // これは正常な挙動なのでdebugログのみ
            logger.debug("ASA attribution not available: \(error.localizedDescription)")

            // トークン取得/通信失敗は organic と区別して記録（asa_attribution は立てない）
            AnalyticsManager.shared.setUserProperty("asa_attribution_status", value: "unavailable")
            AttributionPersonProperties.apply(["asa_attribution_status": "unavailable"])
        }
    }

    /// PostHog の person プロパティにも asa_* を設定（distinct_id = RevenueCat appUserID）
    private func setPostHogProperties(attribution: ASAAttributionData) {
        var props: [String: Any] = [
            "asa_attribution": attribution.attribution,
            "asa_attribution_status": attribution.attribution ? "attributed" : "organic",
        ]
        if let v = attribution.orgId { props["asa_org_id"] = v }
        if let v = attribution.campaignId { props["asa_campaign_id"] = v }
        if let v = attribution.adGroupId { props["asa_ad_group_id"] = v }
        if let v = attribution.keywordId { props["asa_keyword_id"] = v }
        if let v = attribution.adId { props["asa_ad_id"] = v }
        if let v = attribution.countryOrRegion { props["asa_country"] = v }
        if let v = attribution.conversionType { props["asa_conversion_type"] = v }
        if let v = attribution.claimType { props["asa_claim_type"] = v }
        if let v = attribution.clickDate { props["asa_click_date"] = v }
        if attribution.attribution { props["source"] = "apple_search_ads" }
        AttributionPersonProperties.apply(props)
        PostHogSDK.shared.capture("apple_adservices_attribution", properties: props)
    }

    /// AppleのAttribution APIにトークンを送信
    private func fetchAttributionData(token: String) async throws -> ASAAttributionData {
        guard let url = URL(string: "https://api-adservices.apple.com/api/v1/") else {
            throw ASAError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("text/plain", forHTTPHeaderField: "Content-Type")
        request.httpBody = token.data(using: .utf8)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw ASAError.invalidResponse
        }

        let attribution = try JSONDecoder().decode(ASAAttributionData.self, from: data)
        logger.info("ASA attribution data received: campaign=\(String(describing: attribution.campaignId)), keyword=\(String(describing: attribution.keywordId))")

        return attribution
    }

    /// Mixpanelにattributionデータを設定
    private func setMixpanelProperties(attribution: ASAAttributionData) {
        var properties: [String: MixpanelType] = [
            "asa_attribution": attribution.attribution
        ]

        if let campaignId = attribution.campaignId {
            properties["asa_campaign_id"] = campaignId
        }
        if let adGroupId = attribution.adGroupId {
            properties["asa_ad_group_id"] = adGroupId
        }
        if let keywordId = attribution.keywordId {
            properties["asa_keyword_id"] = keywordId
        }
        if let countryOrRegion = attribution.countryOrRegion {
            properties["asa_country"] = countryOrRegion
        }
        if let conversionType = attribution.conversionType {
            properties["asa_conversion_type"] = conversionType
        }
        if let claimType = attribution.claimType {
            properties["asa_claim_type"] = claimType
        }
        if let adId = attribution.adId {
            properties["asa_ad_id"] = adId
        }

        AnalyticsManager.shared.setUserProperties(properties)
        logger.info("ASA attribution properties set in Mixpanel")
    }
}

// MARK: - PostHog person properties

/// 流入元プロパティを保存し、PostHog の person（distinct_id = Purchases.shared.appUserID）に $set する。
/// RevenueCat の logIn で appUserID が変わったら reidentify() で同じプロパティを付け直す。
enum AttributionPersonProperties {
    private static let storeKey = "attribution_person_properties"

    static var stored: [String: Any] {
        UserDefaults.standard.dictionary(forKey: storeKey) ?? [:]
    }

    static func apply(_ props: [String: Any]) {
        var merged = stored
        props.forEach { merged[$0.key] = $0.value }
        UserDefaults.standard.set(merged, forKey: storeKey)
        PostHogSDK.shared.identify(Purchases.shared.appUserID, userProperties: props)
    }

    static func reidentify() {
        PostHogSDK.shared.identify(Purchases.shared.appUserID, userProperties: stored)
    }

    /// ランディング/ディープリンクの ct・source を person プロパティにする（初回値は $set_once 相当で保持）
    static func recordCampaign(from url: URL) {
        guard let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems else { return }
        var props: [String: Any] = [:]
        for key in ["ct", "source", "utm_source", "utm_medium", "utm_campaign"] {
            if let v = items.first(where: { $0.name == key })?.value, !v.isEmpty { props[key] = v }
        }
        guard !props.isEmpty else { return }
        if let ct = props["ct"], stored["first_ct"] == nil { props["first_ct"] = ct }
        apply(props)
    }
}

// MARK: - Data Models

struct ASAAttributionData: Codable {
    let attribution: Bool
    let orgId: Int?
    let campaignId: Int?
    let conversionType: String?
    let clickDate: String?
    let impressionDate: String?
    let claimType: String?
    let adGroupId: Int?
    let countryOrRegion: String?
    let keywordId: Int?
    let adId: Int?
}

enum ASAError: Error {
    case invalidURL
    case invalidResponse
    case decodingFailed
}
