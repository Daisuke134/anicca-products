import Testing
@testable import ChiDaily

struct ConstitutionTypeTests {

    @Test func woodConstitution() {
        let c = ConstitutionType.wood
        #expect(c.displayName == "木")
        #expect(c.color != nil)
    }

    @Test func fireConstitution() {
        let c = ConstitutionType.fire
        #expect(c.displayName == "火")
    }

    @Test func earthConstitution() {
        let c = ConstitutionType.earth
        #expect(c.displayName == "土")
    }

    @Test func metalConstitution() {
        let c = ConstitutionType.metal
        #expect(c.displayName == "金")
    }

    @Test func waterConstitution() {
        let c = ConstitutionType.water
        #expect(c.displayName == "水")
    }

    @Test func allCasesExist() {
        let allCases = ConstitutionType.allCases
        #expect(allCases.count == 5)
    }
}
