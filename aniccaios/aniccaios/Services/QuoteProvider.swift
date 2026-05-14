import Foundation

/// Affirmation quote with stable id (for notification deep-link).
struct Quote: Identifiable, Codable, Hashable {
    let id: String
    let text: String
}

/// Medium-length single-sentence affirmations in the established autosuggestion tradition.
/// Themes: becoming, growth, presence, peace, love, confidence, gratitude, well-being.
/// Tone: spiritual / mindful — explicitly avoiding materialism (money flow / popularity / hedonism).
final class QuoteProvider {
    static let shared = QuoteProvider()
    private init() {}

    func all(preferredLanguage: LanguagePreference = LanguagePreference.detectDefault()) -> [Quote] {
        switch preferredLanguage {
        case .ja: return Self.ja
        case .en, .de, .fr, .es, .ptBR: return Self.en
        }
    }

    func byId(_ id: String, preferredLanguage: LanguagePreference = LanguagePreference.detectDefault()) -> Quote? {
        return all(preferredLanguage: preferredLanguage).first { $0.id == id }
    }

    func todayQuote(preferredLanguage: LanguagePreference, date: Date, calendar: Calendar = .current) -> String {
        let pool = all(preferredLanguage: preferredLanguage)
        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: date) ?? 1
        let index = (dayOfYear - 1) % pool.count
        return pool[index].text
    }

    func todayQuote() -> String {
        return todayQuote(preferredLanguage: LanguagePreference.detectDefault(), date: Date())
    }

    func todayNotificationIds(count: Int = 4, preferredLanguage: LanguagePreference = LanguagePreference.detectDefault(), date: Date = Date(), calendar: Calendar = .current) -> [String] {
        let pool = all(preferredLanguage: preferredLanguage)
        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: date) ?? 1
        let stride = pool.count / max(count, 1)
        let base = (dayOfYear - 1) % pool.count
        return (0..<count).map { pool[(base + $0 * stride) % pool.count].id }
    }

    // MARK: - Pools

    private static let en: [Quote] = [
        // Becoming / growth
        Quote(id: "q001", text: "I am committed to becoming who I am meant to be."),
        Quote(id: "q002", text: "I am constantly growing, learning, and unfolding."),
        Quote(id: "q003", text: "Every breath moves me closer to my truest self."),
        Quote(id: "q004", text: "I have a growth mindset, and I welcome every lesson."),
        Quote(id: "q005", text: "I trust the slow, beautiful work of my becoming."),
        Quote(id: "q006", text: "I let go of who I was, so I can meet who I am."),
        Quote(id: "q007", text: "I am exactly where I need to be in my journey."),
        Quote(id: "q008", text: "I am fully committed to living a meaningful life."),
        Quote(id: "q009", text: "I am open to the next version of myself."),
        Quote(id: "q010", text: "Each day, I move with quiet purpose."),

        // Love / connection
        Quote(id: "q011", text: "I am deeply, completely loved."),
        Quote(id: "q012", text: "I am surrounded by love in every direction."),
        Quote(id: "q013", text: "I am worthy of the love I give and receive."),
        Quote(id: "q014", text: "Love flows through me, easily and freely."),
        Quote(id: "q015", text: "I let love in. I let love out. Both are sacred."),
        Quote(id: "q016", text: "I am held by something greater than my fear."),
        Quote(id: "q017", text: "My heart is open to this moment, and to this life."),
        Quote(id: "q018", text: "I love myself enough to choose what is true."),
        Quote(id: "q019", text: "I see love in the smallest corners of my day."),
        Quote(id: "q020", text: "I am loved, and I let myself feel it."),

        // Peace / calm
        Quote(id: "q021", text: "I am at peace with where I am and where I am going."),
        Quote(id: "q022", text: "Peace lives within me. I return to it whenever I need."),
        Quote(id: "q023", text: "I am safe in this moment. I am safe in this breath."),
        Quote(id: "q024", text: "Stillness is my home. Quiet is my native language."),
        Quote(id: "q025", text: "I am calm at my center, even when the world is loud."),
        Quote(id: "q026", text: "I rest in the quiet space between my thoughts."),
        Quote(id: "q027", text: "I do not need to fix everything. I am allowed to rest."),
        Quote(id: "q028", text: "I breathe in calm. I breathe out tension."),
        Quote(id: "q029", text: "I am gentle with myself, especially on hard days."),
        Quote(id: "q030", text: "I am soft enough to bend, strong enough to stay."),

        // Presence / now
        Quote(id: "q031", text: "I am here, now. That is enough."),
        Quote(id: "q032", text: "This breath is enough. This moment is enough."),
        Quote(id: "q033", text: "I am awake to the small wonders of my day."),
        Quote(id: "q034", text: "I do not need to chase. The moment finds me."),
        Quote(id: "q035", text: "I let this moment be exactly as it is."),
        Quote(id: "q036", text: "I return to my breath. I return to myself."),
        Quote(id: "q037", text: "I am present in this body, this place, this hour."),
        Quote(id: "q038", text: "I notice. I breathe. I begin again."),
        Quote(id: "q039", text: "Everything I need is in this moment."),
        Quote(id: "q040", text: "I belong to this breath, and this breath belongs to me."),

        // Self-confidence / inner strength
        Quote(id: "q041", text: "I have everything within me to live this life."),
        Quote(id: "q042", text: "I trust my voice, my path, and my own timing."),
        Quote(id: "q043", text: "I am the steady ground beneath my own feet."),
        Quote(id: "q044", text: "I am whole, exactly as I am, in this very hour."),
        Quote(id: "q045", text: "I am my own best chance for a meaningful life."),
        Quote(id: "q046", text: "I am stronger than the thoughts that try to shrink me."),
        Quote(id: "q047", text: "I trust myself to walk through whatever comes."),
        Quote(id: "q048", text: "I have the strength to live with a growth mindset."),
        Quote(id: "q049", text: "I am allowed to take up space in this life."),
        Quote(id: "q050", text: "I am steady. I am steady. I am steady."),

        // Gratitude / well-being / abundance (non-material)
        Quote(id: "q051", text: "I am grateful for the breath I take, right this second."),
        Quote(id: "q052", text: "I am grateful for the body that carries me through today."),
        Quote(id: "q053", text: "Today, I notice what is good, and I let it grow."),
        Quote(id: "q054", text: "I am happy, healthy, and centered in myself."),
        Quote(id: "q055", text: "I have everything I need, exactly when I need it."),
        Quote(id: "q056", text: "I am open to receive what life offers me today."),
        Quote(id: "q057", text: "I trust that the right things come in the right time."),
        Quote(id: "q058", text: "I know abundance lives inside me, not outside."),
        Quote(id: "q059", text: "I am rich in the things that cannot be counted."),
        Quote(id: "q060", text: "I am thankful for everything that is, and everything I am."),
    ]

    private static let ja: [Quote] = [
        // 本当の自分になる
        Quote(id: "q001", text: "私は本当の自分になりつつあります。"),
        Quote(id: "q002", text: "私は日々、学び、成長し、開かれていきます。"),
        Quote(id: "q003", text: "一呼吸ごとに、本当の自分に近づいています。"),
        Quote(id: "q004", text: "私はあらゆる経験から、静かに学んでいます。"),
        Quote(id: "q005", text: "私は、自分が育つ速さを信頼しています。"),
        Quote(id: "q006", text: "過去の自分を手放し、今の自分を迎えます。"),
        Quote(id: "q007", text: "私は今、ちょうど良い場所にいます。"),
        Quote(id: "q008", text: "私は意味のある人生を、心から生きています。"),
        Quote(id: "q009", text: "私はこれから現れる自分を、楽しみにしています。"),
        Quote(id: "q010", text: "私は毎日、静かな目的を持って歩いています。"),

        // 愛・つながり
        Quote(id: "q011", text: "私は深く、まるごと愛されています。"),
        Quote(id: "q012", text: "私はあらゆる方向から、愛に包まれています。"),
        Quote(id: "q013", text: "私は、愛を受け取り、愛を与える存在です。"),
        Quote(id: "q014", text: "愛は私を通って、軽やかに流れています。"),
        Quote(id: "q015", text: "私はいつでも、愛を感じることができます。"),
        Quote(id: "q016", text: "私は恐れより、大きなものに抱かれています。"),
        Quote(id: "q017", text: "私の心は、この瞬間と人生に開かれています。"),
        Quote(id: "q018", text: "私は、真実を選べるくらい自分を愛しています。"),
        Quote(id: "q019", text: "私は、日常の小さな愛に気づいています。"),
        Quote(id: "q020", text: "私は愛されている、と感じることを自分に許します。"),

        // 平和・静けさ
        Quote(id: "q021", text: "私は、今いる場所にも、向かう先にも平和を感じます。"),
        Quote(id: "q022", text: "私の中心には、いつでも戻れる静けさがあります。"),
        Quote(id: "q023", text: "この瞬間、この呼吸の中で、私は安全です。"),
        Quote(id: "q024", text: "静けさは私の故郷であり、私の母国語です。"),
        Quote(id: "q025", text: "外がどれほど騒がしくても、私の中心は穏やかです。"),
        Quote(id: "q026", text: "私は思考の合間にある、静かな空間に休みます。"),
        Quote(id: "q027", text: "すべてを直さなくていい。私は休んでよいのです。"),
        Quote(id: "q028", text: "穏やかさを吸い、緊張を吐き出します。"),
        Quote(id: "q029", text: "私は、特に辛い日こそ、自分に優しくします。"),
        Quote(id: "q030", text: "私は、しなやかで、そして揺るぎない存在です。"),

        // 今ここ・存在
        Quote(id: "q031", text: "私は今、ここに在ります。それで十分です。"),
        Quote(id: "q032", text: "この呼吸で十分。この瞬間で十分です。"),
        Quote(id: "q033", text: "私は、今日の小さな美しさに気づいています。"),
        Quote(id: "q034", text: "追いかける必要はありません。今が私を見つけます。"),
        Quote(id: "q035", text: "私は、この瞬間をあるがままに受け入れます。"),
        Quote(id: "q036", text: "私は呼吸に戻り、自分自身に戻ります。"),
        Quote(id: "q037", text: "私は、この体、この場所、この時間に在ります。"),
        Quote(id: "q038", text: "気づき、息をして、もう一度始めます。"),
        Quote(id: "q039", text: "私に必要なものは、すべて今この瞬間にあります。"),
        Quote(id: "q040", text: "私はこの呼吸に属し、この呼吸は私のものです。"),

        // 自信・内なる力
        Quote(id: "q041", text: "私はこの人生を生きる力を、すべて持っています。"),
        Quote(id: "q042", text: "私は自分の声、自分の道、自分の時間を信頼しています。"),
        Quote(id: "q043", text: "私は、自分の足元にある確かな大地です。"),
        Quote(id: "q044", text: "私は今のままで、ちょうど完全です。"),
        Quote(id: "q045", text: "私は、意味のある人生を生きる最大の味方です。"),
        Quote(id: "q046", text: "私は、自分を小さくしようとする声より強い。"),
        Quote(id: "q047", text: "何が来ても、自分で歩いていけると信じています。"),
        Quote(id: "q048", text: "私は、成長する心で生きる力を持っています。"),
        Quote(id: "q049", text: "私は、この人生の中で居場所を持っていいのです。"),
        Quote(id: "q050", text: "私は揺るぎなく、揺るぎなく、揺るぎなくここにいます。"),

        // 感謝・健やかさ・豊かさ
        Quote(id: "q051", text: "私は今、この一呼吸に深く感謝しています。"),
        Quote(id: "q052", text: "私は、今日も私を運んでくれる体に感謝しています。"),
        Quote(id: "q053", text: "今日も、良いことに気づき、それを静かに育てます。"),
        Quote(id: "q054", text: "私は幸せで、健康で、自分の中心にいます。"),
        Quote(id: "q055", text: "私は必要なものを、ちょうど良い時に受け取ります。"),
        Quote(id: "q056", text: "私は、今日が差し出すものに、心を開いています。"),
        Quote(id: "q057", text: "ふさわしいものが、ふさわしい時に訪れると信じます。"),
        Quote(id: "q058", text: "豊かさは外ではなく、私の内側にあると知っています。"),
        Quote(id: "q059", text: "私は、数えられないものを、たくさん持っています。"),
        Quote(id: "q060", text: "私は、ある全てと、ある自分に、深く感謝しています。"),
    ]
}

extension LanguagePreference {
    static func detectDefault() -> LanguagePreference {
        let raw = (Locale.preferredLanguages.first ?? "en").lowercased()
        if raw.hasPrefix("ja") { return .ja }
        if raw.hasPrefix("de") { return .de }
        if raw.hasPrefix("fr") { return .fr }
        if raw.hasPrefix("es") { return .es }
        if raw.hasPrefix("pt-br") || raw.hasPrefix("pt_br") { return .ptBR }
        return .en
    }
}
