import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { ArrowLeft, ChevronDown, Plus, X, Users, User, Phone } from 'lucide-react-native';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { colors } from '@/lib/theme';

// Comprehensive list of countries with their ISO codes and names
const COUNTRIES = [
  { code: 'AD', name: 'Andorra' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AI', name: 'Anguilla' },
  { code: 'AL', name: 'Albania' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AO', name: 'Angola' },
  { code: 'AQ', name: 'Antarctica' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AS', name: 'American Samoa' },
  { code: 'AT', name: 'Austria' },
  { code: 'AU', name: 'Australia' },
  { code: 'AW', name: 'Aruba' },
  { code: 'AX', name: 'Åland Islands' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BI', name: 'Burundi' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BL', name: 'Saint Barthélemy' },
  { code: 'BM', name: 'Bermuda' },
  { code: 'BN', name: 'Brunei' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BQ', name: 'Caribbean Netherlands' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BS', name: 'Bahamas' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'BV', name: 'Bouvet Island' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BZ', name: 'Belize' },
  { code: 'CA', name: 'Canada' },
  { code: 'CC', name: 'Cocos (Keeling) Islands' },
  { code: 'CD', name: 'Democratic Republic of the Congo' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'CG', name: 'Republic of the Congo' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'CI', name: 'Côte d\'Ivoire' },
  { code: 'CK', name: 'Cook Islands' },
  { code: 'CL', name: 'Chile' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CU', name: 'Cuba' },
  { code: 'CV', name: 'Cape Verde' },
  { code: 'CW', name: 'Curaçao' },
  { code: 'CX', name: 'Christmas Island' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DE', name: 'Germany' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'DK', name: 'Denmark' },
  { code: 'DM', name: 'Dominica' },
  { code: 'DO', name: 'Dominican Republic' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'EE', name: 'Estonia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'EH', name: 'Western Sahara' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'ES', name: 'Spain' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'FK', name: 'Falkland Islands' },
  { code: 'FM', name: 'Federated States of Micronesia' },
  { code: 'FO', name: 'Faroe Islands' },
  { code: 'FR', name: 'France' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'GD', name: 'Grenada' },
  { code: 'GE', name: 'Georgia' },
  { code: 'GF', name: 'French Guiana' },
  { code: 'GG', name: 'Guernsey' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GI', name: 'Gibraltar' },
  { code: 'GL', name: 'Greenland' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GP', name: 'Guadeloupe' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'GR', name: 'Greece' },
  { code: 'GS', name: 'South Georgia and the South Sandwich Islands' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GU', name: 'Guam' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'GY', name: 'Guyana' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HM', name: 'Heard Island and McDonald Islands' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HR', name: 'Croatia' },
  { code: 'HT', name: 'Haiti' },
  { code: 'HU', name: 'Hungary' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IM', name: 'Isle of Man' },
  { code: 'IN', name: 'India' },
  { code: 'IO', name: 'British Indian Ocean Territory' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IR', name: 'Iran' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IT', name: 'Italy' },
  { code: 'JE', name: 'Jersey' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'JO', name: 'Jordan' },
  { code: 'JP', name: 'Japan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'KI', name: 'Kiribati' },
  { code: 'KM', name: 'Comoros' },
  { code: 'KN', name: 'Saint Kitts and Nevis' },
  { code: 'KP', name: 'North Korea' },
  { code: 'KR', name: 'South Korea' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'KY', name: 'Cayman Islands' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'LA', name: 'Laos' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LC', name: 'Saint Lucia' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'LR', name: 'Liberia' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LY', name: 'Libya' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MD', name: 'Moldova' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MF', name: 'Saint Martin' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MH', name: 'Marshall Islands' },
  { code: 'MK', name: 'North Macedonia' },
  { code: 'ML', name: 'Mali' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'MO', name: 'Macau' },
  { code: 'MP', name: 'Northern Mariana Islands' },
  { code: 'MQ', name: 'Martinique' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MS', name: 'Montserrat' },
  { code: 'MT', name: 'Malta' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MV', name: 'Maldives' },
  { code: 'MW', name: 'Malawi' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'NA', name: 'Namibia' },
  { code: 'NC', name: 'New Caledonia' },
  { code: 'NE', name: 'Niger' },
  { code: 'NF', name: 'Norfolk Island' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NO', name: 'Norway' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NR', name: 'Nauru' },
  { code: 'NU', name: 'Niue' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'OM', name: 'Oman' },
  { code: 'PA', name: 'Panama' },
  { code: 'PE', name: 'Peru' },
  { code: 'PF', name: 'French Polynesia' },
  { code: 'PG', name: 'Papua New Guinea' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PL', name: 'Poland' },
  { code: 'PM', name: 'Saint Pierre and Miquelon' },
  { code: 'PN', name: 'Pitcairn Islands' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'PS', name: 'Palestine' },
  { code: 'PT', name: 'Portugal' },
  { code: 'PW', name: 'Palau' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RE', name: 'Réunion' },
  { code: 'RO', name: 'Romania' },
  { code: 'RS', name: 'Serbia' },
  { code: 'RU', name: 'Russia' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SB', name: 'Solomon Islands' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SD', name: 'Sudan' },
  { code: 'SE', name: 'Sweden' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SH', name: 'Saint Helena' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SJ', name: 'Svalbard and Jan Mayen' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SM', name: 'San Marino' },
  { code: 'SN', name: 'Senegal' },
  { code: 'SO', name: 'Somalia' },
  { code: 'SR', name: 'Suriname' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'ST', name: 'São Tomé and Príncipe' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'SX', name: 'Sint Maarten' },
  { code: 'SY', name: 'Syria' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'TC', name: 'Turks and Caicos Islands' },
  { code: 'TD', name: 'Chad' },
  { code: 'TF', name: 'French Southern and Antarctic Lands' },
  { code: 'TG', name: 'Togo' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TJ', name: 'Tajikistan' },
  { code: 'TK', name: 'Tokelau' },
  { code: 'TL', name: 'East Timor' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TO', name: 'Tonga' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TT', name: 'Trinidad and Tobago' },
  { code: 'TV', name: 'Tuvalu' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'UG', name: 'Uganda' },
  { code: 'UM', name: 'United States Minor Outlying Islands' },
  { code: 'US', name: 'United States' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VA', name: 'Vatican City' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VG', name: 'British Virgin Islands' },
  { code: 'VI', name: 'U.S. Virgin Islands' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'VU', name: 'Vanuatu' },
  { code: 'WF', name: 'Wallis and Futuna' },
  { code: 'WS', name: 'Samoa' },
  { code: 'YE', name: 'Yemen' },
  { code: 'YT', name: 'Mayotte' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
];

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  ageBand: string;
  medicalNote?: string;
  contactInfo?: string;
  isPet?: boolean;
  petType?: string;
}

const AGE_BANDS = [
  'Infant (0-2)',
  'Child (3-12)',
  'Teen (13-17)',
  'Adult (18-64)',
  'Senior (65+)',
];

const PET_TYPES = [
  'Dog',
  'Cat',
  'Bird',
  'Fish',
  'Rabbit',
  'Hamster',
  'Guinea Pig',
  'Reptile',
  'Other',
];

export default function CreateHouseholdScreen() {
  const [householdName, setHouseholdName] = useState('My Household');
  const [country, setCountry] = useState('US');
  const [countryName, setCountryName] = useState('United States');
  const [postalCode, setPostalCode] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Creating household...');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    ageBand: 'Adult (18-64)',
    medicalNote: '',
    contactInfo: '',
    isPet: false,
    petType: 'Dog',
  });
  
  // Creator information
  const [creatorInfo, setCreatorInfo] = useState({
    firstName: '',
    lastName: '',
    ageBand: 'Adult (18-64)',
    medicalNote: '',
    contactInfo: '',
  });
  
  const router = useRouter();
  const { user } = useAuth();
  const { refreshHouseholds } = useHousehold();

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleCountrySelect = (selectedCountry: { code: string; name: string }) => {
    setCountry(selectedCountry.code);
    setCountryName(selectedCountry.name);
    setCountrySearch('');
    setShowCountryDropdown(false);
  };

  const handleCountrySearchChange = (text: string) => {
    setCountrySearch(text);
    setShowCountryDropdown(true);
  };

  const addMember = () => {
    if (!newMember.firstName || !newMember.lastName) {
      Alert.alert('Error', 'Please fill in first and last name');
      return;
    }

    const member: Member = {
      id: Date.now().toString(),
      ...newMember,
    };

    setMembers(prev => [...prev, member]);
    setNewMember({
      firstName: '',
      lastName: '',
      ageBand: 'Adult (18-64)',
      medicalNote: '',
      contactInfo: '',
      isPet: false,
      petType: 'Dog',
    });
    setShowAddMember(false);
  };

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(member => member.id !== id));
  };

  const addInviteEmail = () => {
    setInviteEmails(prev => [...prev, '']);
  };

  const updateInviteEmail = (index: number, email: string) => {
    setInviteEmails(prev => prev.map((email, i) => i === index ? email : email));
  };

  const removeInviteEmail = (index: number) => {
    setInviteEmails(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!country || !postalCode) {
      Alert.alert('Error', 'Please fill in country and postal code');
      return;
    }

    if (!creatorInfo.firstName || !creatorInfo.lastName) {
      Alert.alert('Error', 'Please fill in your first and last name');
      return;
    }

    setLoading(true);
    setLoadingMessage('Creating household...');
    
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a household');
        return;
      }
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let accountId;
      
      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        // Create new account
        const { data: newAccount, error: insertError } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            display_name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        accountId = newAccount.id;
      }

      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          name: householdName,
          country,
          zip_code: postalCode,
        })
        .select()
        .single();

      if (householdError) throw householdError;

      // Create membership as owner
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          account_id: accountId,
          household_id: household.id,
          role: 'owner',
        });

      if (membershipError) throw membershipError;

      // Separate members and pets
      const memberInserts: any[] = [];
      const petInserts: any[] = [];

      members.forEach(member => {
        if (member.isPet) {
          // Add to pets table
          petInserts.push({
            household_id: household.id,
            name: `${member.firstName} ${member.lastName}`.trim(),
            type: member.petType || 'Dog',
            size: 'medium', // Default size
            medical_notes: member.medicalNote || null,
          });
        } else {
          // Add to members table
          memberInserts.push({
            household_id: household.id,
            name: `${member.firstName} ${member.lastName}`.trim(),
            age_group: member.ageBand.split(' ')[0].toLowerCase(),
            medical_notes: member.medicalNote || null,
            contact_info: member.contactInfo ? 
              member.contactInfo.replace(/\D/g, '') : null,
          });
        }
      });

      // Add yourself as a member (linked to your account)
      memberInserts.push({
        household_id: household.id,
        name: `${creatorInfo.firstName} ${creatorInfo.lastName}`.trim(),
        age_group: creatorInfo.ageBand.split(' ')[0].toLowerCase(),
        medical_notes: creatorInfo.medicalNote || null,
        contact_info: creatorInfo.contactInfo ? 
          creatorInfo.contactInfo.replace(/\D/g, '') : null,
        claimed_by: user.id,
      });

      // Insert members
      if (memberInserts.length > 0) {
        const { error: memberError } = await supabase
          .from('members')
          .insert(memberInserts);

        if (memberError) throw memberError;
      }

      // Insert pets
      if (petInserts.length > 0) {
        const { error: petError } = await supabase
          .from('pets')
          .insert(petInserts);

        if (petError) throw petError;
      }

      // Initialize donut status for all hazard types
      const hazardTypes = ['hurricane', 'wildfire', 'flood', 'earthquake', 'tornado', 'heat'];
      const donutStatusInserts = hazardTypes.map(hazard => ({
        household_id: household.id,
        hazard_type: hazard,
        readiness_percentage: 0,
      }));

      const { error: donutError } = await supabase
        .from('donut_status')
        .insert(donutStatusInserts);

      if (donutError) throw donutError;

      // Show success immediately, generate checklists in background
      Alert.alert('Success', 'Household created successfully! Your emergency checklists are being generated in the background.', [
        {
          text: 'OK',
          onPress: async () => {
            await refreshHouseholds();
            router.push('/(tabs)/dashboard');
          },
        },
      ]);

      // Generate checklists in background (don't await)
      setTimeout(async () => {
        try {
          const { generateAllChecklists } = await import('@/lib/checklist');
          await generateAllChecklists(household.id);
          // Background checklist generation completed
        } catch (checklistError) {
          // Background checklist generation failed
        }
      }, 100); // Small delay to let the UI update first
    } catch (error: any) {
      // Error creating household
      Alert.alert('Error', error.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Household</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Household Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Household Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={householdName}
              onChangeText={setHouseholdName}
              placeholder="My Household"
              placeholderTextColor="#6b7280"
              autoCapitalize="words"
            />
          </View>

          {/* Country */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country *</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowCountryDropdown(!showCountryDropdown)}
              >
                <Text style={styles.dropdownButtonText}>
                  {countryName}
                </Text>
                <ChevronDown size={20} color="#6b7280" />
              </TouchableOpacity>
              
              {showCountryDropdown && (
                <View style={styles.dropdown}>
                  <TextInput
                    style={styles.searchInput}
                    value={countrySearch}
                    onChangeText={handleCountrySearchChange}
                    placeholder="Search countries..."
                    placeholderTextColor="#6b7280"
                    autoFocus={true}
                  />
                  <FlatList
                    data={filteredCountries}
                    keyExtractor={(item) => item.code}
                    style={styles.countryList}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.countryItem}
                        onPress={() => handleCountrySelect(item)}
                      >
                        <Text style={styles.countryName}>{item.name}</Text>
                        <Text style={styles.countryCode}>{item.code}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Postal Code */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Postal Code / ZIP *</Text>
            <TextInput
              style={styles.input}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="Enter your postal code"
              placeholderTextColor="#6b7280"
              keyboardType="default"
            />
          </View>

          {/* Creator Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Information</Text>
            <Text style={styles.sectionDescription}>
              Tell us about yourself first
            </Text>
            
            <View style={styles.nameRow}>
              <View style={[styles.inputGroup, styles.nameField]}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={creatorInfo.firstName}
                  onChangeText={(text) => setCreatorInfo(prev => ({ ...prev, firstName: text }))}
                  placeholder="Your first name"
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputGroup, styles.nameField]}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={creatorInfo.lastName}
                  onChangeText={(text) => setCreatorInfo(prev => ({ ...prev, lastName: text }))}
                  placeholder="Your last name"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age Band *</Text>
              <View style={styles.ageBandContainer}>
                {AGE_BANDS.map((band) => (
                  <TouchableOpacity
                    key={band}
                    style={[
                      styles.ageBandButton,
                      creatorInfo.ageBand === band && styles.ageBandButtonSelected
                    ]}
                    onPress={() => setCreatorInfo(prev => ({ ...prev, ageBand: band }))}
                  >
                    <Text style={[
                      styles.ageBandText,
                      creatorInfo.ageBand === band && styles.ageBandTextSelected
                    ]}>
                      {band}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medical Note (Optional)</Text>
              <TextInput
                style={styles.input}
                value={creatorInfo.medicalNote}
                onChangeText={(text) => setCreatorInfo(prev => ({ ...prev, medicalNote: text }))}
                placeholder="e.g., asthma inhaler"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Info (Optional)</Text>
              <TextInput
                style={styles.input}
                value={creatorInfo.contactInfo}
                onChangeText={(text) => {
                  const formatted = formatPhoneNumber(text);
                  setCreatorInfo(prev => ({ ...prev, contactInfo: formatted }));
                }}
                placeholder="(000) 000-0000"
                keyboardType="phone-pad"
                maxLength={14}
              />
            </View>
          </View>

          {/* Members Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Household Members & Pets</Text>

            {/* Members List */}
            {members.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.firstName} {member.lastName}
                  </Text>
                  <Text style={styles.memberDetails}>
                    {member.ageBand} {member.isPet ? '• Pet' : ''}
                  </Text>
                  {member.medicalNote && (
                    <Text style={styles.medicalNote}>
                      Medical: {member.medicalNote}
                    </Text>
                  )}
                  {member.contactInfo && (
                    <Text style={styles.contactInfo}>
                      Contact: {member.contactInfo}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeMember(member.id)}
                >
                  <X size={20} color="#354eab" />
                </TouchableOpacity>
              </View>
            ))}

            {!showAddMember && (
              <View style={styles.addButtonsContainer}>
                <TouchableOpacity
                  style={[styles.addButton, styles.addMemberButton]}
                  onPress={() => {
                    setNewMember(prev => ({ ...prev, isPet: false }));
                    setShowAddMember(true);
                  }}
                >
                  <Plus size={20} color="#354eab" />
                  <Text style={styles.addButtonText}>Add Member</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.addButton, styles.addPetButton]}
                  onPress={() => {
                    setNewMember(prev => ({ ...prev, isPet: true, petType: 'Dog' }));
                    setShowAddMember(true);
                  }}
                >
                  <Plus size={20} color="#354eab" />
                  <Text style={styles.addButtonText}>Add Pet</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Add Member Form */}
            {showAddMember && (
              <View style={styles.addMemberForm}>
                <Text style={styles.formTitle}>{newMember.isPet ? 'Add New Pet' : 'Add New Member'}</Text>
                
                <View style={styles.nameRow}>
                  <View style={[styles.inputGroup, styles.nameField]}>
                    <Text style={styles.label}>First Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={newMember.firstName}
                      onChangeText={(text) => setNewMember(prev => ({ ...prev, firstName: text }))}
                      placeholder="First name"
                      placeholderTextColor="#6b7280"
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={[styles.inputGroup, styles.nameField]}>
                    <Text style={styles.label}>Last Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={newMember.lastName}
                      onChangeText={(text) => setNewMember(prev => ({ ...prev, lastName: text }))}
                      placeholder="Last name"
                      placeholderTextColor="#6b7280"
                      autoCapitalize="words"
                    />
                  </View>
                </View>


                {!newMember.isPet ? (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Age Band *</Text>
                    <View style={styles.ageBandContainer}>
                      {AGE_BANDS.map((band) => (
                        <TouchableOpacity
                          key={band}
                          style={[
                            styles.ageBandButton,
                            newMember.ageBand === band && styles.ageBandButtonSelected
                          ]}
                          onPress={() => setNewMember(prev => ({ ...prev, ageBand: band }))}
                        >
                          <Text style={[
                            styles.ageBandText,
                            newMember.ageBand === band && styles.ageBandTextSelected
                          ]}>
                            {band}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Pet Type *</Text>
                    <View style={styles.ageBandContainer}>
                      {PET_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.ageBandButton,
                            newMember.petType === type && styles.ageBandButtonSelected
                          ]}
                          onPress={() => setNewMember(prev => ({ ...prev, petType: type }))}
                        >
                          <Text style={[
                            styles.ageBandText,
                            newMember.petType === type && styles.ageBandTextSelected
                          ]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Medical Note (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={newMember.medicalNote}
                    onChangeText={(text) => setNewMember(prev => ({ ...prev, medicalNote: text }))}
                    placeholder={newMember.isPet ? "e.g., allergies, medications" : "e.g., asthma inhaler"}
                    placeholderTextColor="#6b7280"
                    multiline
                  />
                </View>

                {!newMember.isPet && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contact Info (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={newMember.contactInfo}
                      onChangeText={(text) => {
                        const formatted = formatPhoneNumber(text);
                        setNewMember(prev => ({ ...prev, contactInfo: formatted }));
                      }}
                      placeholder="(000) 000-0000"
                      placeholderTextColor="#6b7280"
                      keyboardType="phone-pad"
                      maxLength={14}
                    />
                  </View>
                )}

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowAddMember(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={addMember}
                  >
                    <Text style={styles.saveButtonText}>{newMember.isPet ? 'Add Pet' : 'Add Member'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? loadingMessage : 'Create Household'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 16,
  },
  spacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  form: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    fontSize: 16,
    color: '#1f2937',
  },
  countryList: {
    maxHeight: 150,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  countryName: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  countryCode: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    marginTop: 32,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.buttonSecondary + '22',
    borderColor: colors.buttonSecondary,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonFullWidth: {
    marginTop: 16,
    paddingVertical: 12,
  },
  addButtonText: {
    color: '#354eab',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  memberCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  memberDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  medicalNote: {
    fontSize: 12,
    color: '#354eab',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  contactInfo: {
    fontSize: 12,
    color: '#059669',
  },
  removeButton: {
    padding: 8,
  },
  addMemberForm: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  ageBandContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ageBandButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ageBandButtonSelected: {
    backgroundColor: '#354eab',
    borderColor: '#354eab',
  },
  ageBandText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  ageBandTextSelected: {
    color: '#ffffff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#354eab',
    borderColor: '#354eab',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#354eab',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    marginRight: 12,
  },
  removeInviteButton: {
    padding: 8,
  },
  addInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.buttonSecondary + '22',
    borderColor: colors.buttonSecondary,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  addInviteButtonText: {
    color: '#354eab',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#354eab',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addMemberButton: {
    flex: 1,
  },
  addPetButton: {
    flex: 1,
  },
});