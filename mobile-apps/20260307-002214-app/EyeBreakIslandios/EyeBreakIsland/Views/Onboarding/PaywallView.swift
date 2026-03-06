import SwiftUI
import RevenueCat

struct PaywallView: View {
    @StateObject private var viewModel: PaywallViewModel
    let onDismiss: () -> Void
    let onPurchaseCompleted: () -> Void

    init(subscriptionService: SubscriptionServiceProtocol, onDismiss: @escaping () -> Void, onPurchaseCompleted: @escaping () -> Void) {
        _viewModel = StateObject(wrappedValue: PaywallViewModel(subscriptionService: subscriptionService))
        self.onDismiss = onDismiss
        self.onPurchaseCompleted = onPurchaseCompleted
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                headerSection
                packagesSection
                purchaseButton
                maybeLaterButton
                restoreButton
                errorSection
            }
            .padding(24)
        }
        .accessibilityIdentifier(AccessibilityID.paywallContainer)
        .task { await viewModel.loadOfferings() }
        .onChange(of: viewModel.purchaseCompleted) { completed in
            if completed { onPurchaseCompleted() }
        }
    }

    // MARK: - Sections

    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "crown.fill")
                .font(.system(size: 48))
                .foregroundStyle(Color.accentColor)

            Text("paywall.title")
                .font(.title.bold())
                .multilineTextAlignment(.center)

            Text("paywall.subtitle")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
    }

    private var packagesSection: some View {
        VStack(spacing: 12) {
            if viewModel.isLoading {
                ProgressView()
                    .frame(height: 120)
            } else if viewModel.packages.isEmpty {
                emptyPackagesView
            } else {
                ForEach(viewModel.packages, id: \.identifier) { package in
                    PackageCardView(
                        package: package,
                        isSelected: viewModel.selectedPackage?.identifier == package.identifier
                    )
                    .onTapGesture {
                        withAnimation(.spring(duration: 0.2)) {
                            viewModel.selectedPackage = package
                        }
                    }
                }
            }
        }
    }

    private var emptyPackagesView: some View {
        VStack(spacing: 8) {
            Text("Unable to load subscription options")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Button("Retry") {
                Task { await viewModel.loadOfferings() }
            }
            .font(.subheadline)
        }
        .frame(height: 120)
    }

    private var purchaseButton: some View {
        Button {
            Task { await viewModel.purchase() }
        } label: {
            Group {
                if viewModel.isPurchasing {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text("paywall.subscribe")
                        .font(.headline)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(
                (viewModel.selectedPackage == nil || viewModel.isPurchasing)
                    ? Color.secondary.opacity(0.3)
                    : Color.accentColor
            )
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .disabled(viewModel.selectedPackage == nil || viewModel.isPurchasing)
        .accessibilityIdentifier(AccessibilityID.paywallSubscribeButton)
    }

    private var maybeLaterButton: some View {
        Button {
            onDismiss()
        } label: {
            Text("paywall.maybe_later")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .accessibilityIdentifier(AccessibilityID.paywallMaybeLater)
    }

    private var restoreButton: some View {
        Button {
            Task { await viewModel.restore() }
        } label: {
            Text("paywall.restore")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .accessibilityIdentifier(AccessibilityID.paywallRestore)
    }

    private var errorSection: some View {
        Group {
            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
            }
        }
    }
}

// MARK: - PackageCardView

struct PackageCardView: View {
    let package: Package
    let isSelected: Bool

    private var isAnnual: Bool {
        package.packageType == .annual
    }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(package.storeProduct.localizedTitle)
                        .font(.headline)
                    if isAnnual {
                        Text("BEST VALUE")
                            .font(.caption2.bold())
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.green)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 4))
                    }
                }
                Text(package.localizedPriceString)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                if let intro = package.storeProduct.introductoryDiscount {
                    Text("\(intro.subscriptionPeriod.value)-day free trial")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                .font(.title2)
                .foregroundStyle(isSelected ? Color.accentColor : .secondary)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isSelected ? Color.accentColor : Color.secondary.opacity(0.3), lineWidth: isSelected ? 2 : 1)
        )
        .scaleEffect(isSelected ? 1.02 : 1.0)
        .animation(.spring(duration: 0.2), value: isSelected)
        .accessibilityIdentifier(isAnnual ? AccessibilityID.paywallPackageAnnual : AccessibilityID.paywallPackageMonthly)
    }
}
