/**
 * Data for the glBarristerListing filter form (dropdown lists only).
 * The Search button itself is intentionally NOT handled here.
 */
public with sharing class GlBarristerListingController {
    public class BarristerOption {
        @AuraEnabled public String id;
        @AuraEnabled public String name;

        public BarristerOption(Contact c) {
            this.id = c.Id;
            this.name = c.Name;
        }
    }

    public class AreaOption {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String parent; // value of Area_of_Practices__c (parent Id or parent name)
        @AuraEnabled public Boolean isMain;

        public AreaOption(Area_of_Practice__c a) {
            Object parentValue = a.get('Area_of_Practices__c');
            this.id = a.Id;
            this.name = a.Name;
            this.parent = parentValue == null ? null : String.valueOf(parentValue);
            this.isMain = a.Main_Area__c == true;
        }
    }

    /**
     * Base listing for the cards (glBarristerCards).
     * QC_Date__c is included so the cards can be split into Silks / QC & SC and Senior / Junior.
     */
    @AuraEnabled(cacheable=true)
    public static List<Contact> getBarristerListing() {
        return [
            SELECT Id, Name, Barrister_Photo_Small__c, Bar_Role_Date__c, QC_Date__c
            FROM Contact
            WHERE RecordType.DeveloperName = 'Barrister' AND Deactivate__c = false
            WITH USER_MODE
            ORDER BY LastName, FirstName
            LIMIT 2000
        ];
    }

    /**
     * Blank term  -> all active barristers
     * With a term -> active barristers whose Name or LastName contains the term
     */
    @AuraEnabled(cacheable=true)
    public static List<BarristerOption> getBarristers(String searchTerm) {
        List<Contact> contacts;
        if (String.isBlank(searchTerm)) {
            contacts = [
                SELECT Id, Name, LastName
                FROM Contact
                WHERE RecordType.DeveloperName = 'Barrister' AND Deactivate__c = false
                WITH USER_MODE
                ORDER BY LastName, FirstName
                LIMIT 2000
            ];
        } else {
            String term = '%' + searchTerm.trim() + '%';
            contacts = [
                SELECT Id, Name, LastName
                FROM Contact
                WHERE RecordType.DeveloperName = 'Barrister'
                    AND Deactivate__c = false
                    AND (Name LIKE :term OR LastName LIKE :term)
                WITH USER_MODE
                ORDER BY LastName, FirstName
                LIMIT 2000
            ];
        }

        List<BarristerOption> result = new List<BarristerOption>();
        for (Contact c : contacts) {
            result.add(new BarristerOption(c));
        }
        return result;
    }

    /**
     * Blank term  -> every area of practice (main areas and sub areas)
     * With a term -> only the records whose Name matches
     */
    @AuraEnabled(cacheable=true)
    public static List<AreaOption> getAreasOfPractice(String searchTerm) {
        List<Area_of_Practice__c> areas;
        if (String.isBlank(searchTerm)) {
            areas = [
                SELECT Id, Area_of_Practices__c, Main_Area__c, Name
                FROM Area_of_Practice__c
                WITH USER_MODE
                ORDER BY Name
            ];
        } else {
            String term = '%' + searchTerm.trim() + '%';
            areas = [
                SELECT Id, Area_of_Practices__c, Main_Area__c, Name
                FROM Area_of_Practice__c
                WHERE Name LIKE :term
                WITH USER_MODE
                ORDER BY Name
            ];
        }

        List<AreaOption> result = new List<AreaOption>();
        for (Area_of_Practice__c a : areas) {
            result.add(new AreaOption(a));
        }
        return result;
    }
}