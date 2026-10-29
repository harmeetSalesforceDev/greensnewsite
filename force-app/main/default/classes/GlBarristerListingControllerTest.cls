@IsTest
private class GlBarristerListingControllerTest {
    @TestSetup
    static void setup() {
        Area_of_Practice__c main = new Area_of_Practice__c(Name = 'Alternative Dispute Resolution', Main_Area__c = true);
        insert main;

        Area_of_Practice__c sub = new Area_of_Practice__c(Name = 'Arbitration', Main_Area__c = false);
        sub.put('Area_of_Practices__c', String.valueOf(main.Id));
        insert sub;

        Schema.RecordTypeInfo rt = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Barrister');
        if (rt != null) {
            insert new List<Contact>{
                new Contact(LastName = 'Active Barrister', RecordTypeId = rt.getRecordTypeId(), Deactivate__c = false),
                new Contact(LastName = 'Inactive Barrister', RecordTypeId = rt.getRecordTypeId(), Deactivate__c = true)
            };
        }
    }

    @IsTest
    static void returnsAllAreas() {
        System.assertEquals(2, GlBarristerListingController.getAreasOfPractice('').size());
    }

    @IsTest
    static void searchesAreasByName() {
        List<GlBarristerListingController.AreaOption> result = GlBarristerListingController.getAreasOfPractice('Arbitr');
        System.assertEquals(1, result.size());
        System.assertEquals(false, result[0].isMain);
        System.assertNotEquals(null, result[0].parent);
    }

    @IsTest
    static void returnsOnlyActiveBarristers() {
        Boolean hasRecordType = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Barrister') != null;
        Integer expected = hasRecordType ? 1 : 0;
        System.assertEquals(expected, GlBarristerListingController.getBarristers('').size());
        System.assertEquals(expected, GlBarristerListingController.getBarristers('Active').size());
        System.assertEquals(0, GlBarristerListingController.getBarristers('Inactive').size());
    }

    @IsTest
    static void returnsBaseListing() {
        Boolean hasRecordType = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Barrister') != null;
        Integer expected = hasRecordType ? 1 : 0;
        System.assertEquals(expected, GlBarristerListingController.getBarristerListing().size());
    }
}