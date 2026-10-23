@IsTest
private class GlClerksControllerTest {
    @TestSetup
    static void setup() {
        insert new List<Contact>{
            new Contact(
                LastName = 'Director One',
                Staff_Role__c = 'Director',
                Profile__c = 'Director | Barristers Clerk',
                Deactivate__c = false
            ),
            new Contact(
                LastName = 'Clerk One',
                Staff_Role__c = 'Clerk',
                Profile__c = 'Clerk',
                Deactivate__c = false
            ),
            new Contact(
                LastName = 'Blank Profile',
                Staff_Role__c = 'Support',
                Deactivate__c = false
            ),
            new Contact(
                LastName = 'Deactivated',
                Staff_Role__c = 'Clerk',
                Profile__c = 'Clerk',
                Deactivate__c = true
            ),
            new Contact(
                LastName = 'No Role',
                Profile__c = 'Clerk',
                Deactivate__c = false
            )
        };
    }

    @IsTest
    static void splitsDirectorsAndStaff() {
        Test.startTest();
        GlClerksController.ClerksData data = GlClerksController.getClerksData();
        Test.stopTest();

        System.assertEquals(1, data.directors.size(), 'One active director');
        System.assertEquals('Director One', data.directors[0].name);
        System.assertEquals(2, data.staff.size(), 'Active non-directors with a staff role');
    }
}