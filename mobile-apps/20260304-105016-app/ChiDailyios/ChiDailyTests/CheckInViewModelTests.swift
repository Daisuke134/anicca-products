import Testing
@testable import ChiDaily

struct CheckInViewModelTests {

    @Test func initialState() {
        let vm = CheckInViewModel()
        #expect(vm.currentStep == 0)
        #expect(vm.energyLevel == 3)
        #expect(vm.sleepQuality == 3)
        #expect(vm.digestionComfort == 3)
        #expect(vm.emotionalState == 3)
        #expect(vm.physicalSensation == 3)
        #expect(vm.isComplete == false)
        #expect(vm.isLoading == false)
    }

    @Test func totalSteps() {
        let vm = CheckInViewModel()
        #expect(vm.totalSteps == 5)
    }

    @Test func nextStepAdvances() {
        let vm = CheckInViewModel()
        vm.nextStep()
        #expect(vm.currentStep == 1)
    }

    @Test func previousStepRetreats() {
        let vm = CheckInViewModel()
        vm.nextStep()
        vm.previousStep()
        #expect(vm.currentStep == 0)
    }

    @Test func previousStepAtZeroStaysZero() {
        let vm = CheckInViewModel()
        vm.previousStep()
        #expect(vm.currentStep == 0)
    }
}
