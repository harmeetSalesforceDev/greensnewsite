/**
 * Provides the clerks / staff directory for the Greens List clerks page (glClerksBody).
 * One query, partitioned in Apex so the SOQL ORDER BY (Clerk_Order__c) is preserved
 * inside each group.
 */
public without sharing class GlClerksController {
    @TestVisible
    private static final String DIRECTOR_PROFILE = 'Director | Barristers Clerk';

    public class StaffMember {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String staffRole;
        @AuraEnabled public String profile;
        @AuraEnabled public String phone;
        @AuraEnabled public String email;
        @AuraEnabled public String photo;

        public StaffMember(Contact c) {
            this.id = c.Id;
            this.name = c.Name;
            this.staffRole = c.Staff_Role__c;
            this.profile = c.Profile__c;
            this.phone = c.Phone;
            this.email = c.Email;
            this.photo = c.Photo__c;
        }
    }

    public class ClerksData {
        @AuraEnabled public List<StaffMember> directors = new List<StaffMember>();
        @AuraEnabled public List<StaffMember> staff = new List<StaffMember>();
    }

    @AuraEnabled(cacheable=true)
    public static ClerksData getClerksData() {
        ClerksData result = new ClerksData();

        List<Contact> contacts = [
            SELECT Id, Staff_Role__c, Photo__c, Name, Phone, Profile__c, Email, Deactivate__c
            FROM Contact
            WHERE Staff_Role__c != null AND Deactivate__c = false
            ORDER BY Clerk_Order__c
        ];

        for (Contact c : contacts) {
            if (c.Profile__c == DIRECTOR_PROFILE) {
                result.directors.add(new StaffMember(c));
            } else {
                // Same as: Profile__c != 'Director | Barristers Clerk' (SOQL != also matches blanks)
                result.staff.add(new StaffMember(c));
            }
        }
        return result;
    }
}