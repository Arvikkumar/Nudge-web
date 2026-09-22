export type EventCategoryType =
  | 'Hindu Festival'
  | 'National Day'
  | 'Cultural Event'
  | 'International Observance'
  | 'Religious Observance'
  | 'Awareness Day'
  | 'Public Holiday';

export interface NudgeEvent {
  id: string;
  name: string;
  month: number; // 1-12
  day: number; // 1-31
  year?: number; // null/undefined for fixed annual events
  category: EventCategoryType;
  description: string;
  traditionOrRegion?: string;
}

export interface EventStyle {
  bgLight: string;
  textLight: string;
  badgeBgLight: string;
  badgeTextLight: string;
  bgDark: string;
  textDark: string;
  badgeBgDark: string;
  badgeTextDark: string;
  dotColor: string;
}

export const EVENT_CATEGORY_STYLES: Record<EventCategoryType, EventStyle> = {
  'Hindu Festival': {
    bgLight: 'bg-[#FFF8EC]',
    textLight: 'text-[#4E2600]',
    badgeBgLight: 'bg-[#FFE4BF]',
    badgeTextLight: 'text-[#4E2600]',
    bgDark: 'dark:bg-[#2B2117]',
    textDark: 'dark:text-[#FFD180]',
    badgeBgDark: 'dark:bg-[#523D26]',
    badgeTextDark: 'dark:text-[#FFD180]',
    dotColor: '#D97706', // amber-600
  },
  'National Day': {
    bgLight: 'bg-[#EFF4FC]',
    textLight: 'text-[#0E2554]',
    badgeBgLight: 'bg-[#D7E4FB]',
    badgeTextLight: 'text-[#0E2554]',
    bgDark: 'dark:bg-[#142238]',
    textDark: 'dark:text-[#90CAF9]',
    badgeBgDark: 'dark:bg-[#203657]',
    badgeTextDark: 'dark:text-[#90CAF9]',
    dotColor: '#2563EB', // blue-600
  },
  'Cultural Event': {
    bgLight: 'bg-[#F1F8F3]',
    textLight: 'text-[#0E3F1F]',
    badgeBgLight: 'bg-[#D4EED8]',
    badgeTextLight: 'text-[#0E3F1F]',
    bgDark: 'dark:bg-[#13281B]',
    textDark: 'dark:text-[#A5D6A7]',
    badgeBgDark: 'dark:bg-[#24442F]',
    badgeTextDark: 'dark:text-[#A5D6A7]',
    dotColor: '#059669', // emerald-600
  },
  'International Observance': {
    bgLight: 'bg-[#F0F9FB]',
    textLight: 'text-[#053F4D]',
    badgeBgLight: 'bg-[#D2EFF5]',
    badgeTextLight: 'text-[#053F4D]',
    bgDark: 'dark:bg-[#13282D]',
    textDark: 'dark:text-[#80DEEA]',
    badgeBgDark: 'dark:bg-[#234B54]',
    badgeTextDark: 'dark:text-[#80DEEA]',
    dotColor: '#0891B2', // cyan-600
  },
  'Religious Observance': {
    bgLight: 'bg-[#F6F0FC]',
    textLight: 'text-[#3B1266]',
    badgeBgLight: 'bg-[#E8DBFA]',
    badgeTextLight: 'text-[#3B1266]',
    bgDark: 'dark:bg-[#261D30]',
    textDark: 'dark:text-[#CE93D8]',
    badgeBgDark: 'dark:bg-[#443357]',
    badgeTextDark: 'dark:text-[#CE93D8]',
    dotColor: '#7C3AED', // violet-600
  },
  'Awareness Day': {
    bgLight: 'bg-[#FFF2F4]',
    textLight: 'text-[#5C1021]',
    badgeBgLight: 'bg-[#FFDBE1]',
    badgeTextLight: 'text-[#5C1021]',
    bgDark: 'dark:bg-[#2C161C]',
    textDark: 'dark:text-[#F48FB1]',
    badgeBgDark: 'dark:bg-[#502732]',
    badgeTextDark: 'dark:text-[#F48FB1]',
    dotColor: '#E11D48', // rose-600
  },
  'Public Holiday': {
    bgLight: 'bg-[#F4F6F8]',
    textLight: 'text-[#1F2937]',
    badgeBgLight: 'bg-[#E2E8F0]',
    badgeTextLight: 'text-[#1F2937]',
    bgDark: 'dark:bg-[#22252A]',
    textDark: 'dark:text-[#CFD8DC]',
    badgeBgDark: 'dark:bg-[#373E47]',
    badgeTextDark: 'dark:text-[#CFD8DC]',
    dotColor: '#4B5563', // gray-600
  },
};

const ALL_EVENTS: NudgeEvent[] = [
  // --- JANUARY ---
  {
    id: 'fix_jan_01',
    name: "New Year's Day",
    month: 1,
    day: 1,
    category: 'Public Holiday',
    description: 'Welcoming the start of the Gregorian new year with hope, renewal, and fresh beginnings.',
  },
  {
    id: 'fix_jan_01_fam',
    name: 'Global Family Day',
    month: 1,
    day: 1,
    category: 'International Observance',
    description: 'A worldwide celebration of peace, harmony, and the shared human family.',
  },
  {
    id: 'fix_jan_03_savitribai',
    name: 'Savitribai Phule Jayanti',
    month: 1,
    day: 3,
    category: 'National Day',
    description: "Honoring pioneering social reformer and educator who championed women's education and equality.",
    traditionOrRegion: 'Pan-India',
  },
  {
    id: 'fix_jan_04',
    name: 'World Braille Day',
    month: 1,
    day: 4,
    category: 'Awareness Day',
    description: 'Celebrating the importance of Braille as a medium of communication for blind and partially sighted people.',
  },
  {
    id: 'fix_jan_12',
    name: 'National Youth Day',
    month: 1,
    day: 12,
    category: 'National Day',
    description: 'Commemorating the birthday of Swami Vivekananda and inspiring youth toward strength and purpose.',
  },
  {
    id: 'fix_jan_13_lohri',
    name: 'Lohri',
    month: 1,
    day: 13,
    category: 'Cultural Event',
    description: 'Folk festival celebrating the winter harvest, bonfire rituals, and thanksgiving in Northern India.',
    traditionOrRegion: 'North India',
  },
  {
    id: 'fix_jan_14_sankranti',
    name: 'Makar Sankranti / Pongal / Magh Bihu',
    month: 1,
    day: 14,
    category: 'Hindu Festival',
    description: "Harvest festival celebrating the sun's transition into Capricorn (Makara): Sankranti, Pongal, and Magh Bihu.",
    traditionOrRegion: 'Pan-India',
  },
  {
    id: 'fix_jan_15',
    name: 'Indian Army Day',
    month: 1,
    day: 15,
    category: 'National Day',
    description: 'Honoring the valor, sacrifice, and dedication of the soldiers of the Indian Army.',
  },
  {
    id: 'fix_jan_23_netaji',
    name: 'Netaji Subhas Chandra Bose Jayanti (Parakram Diwas)',
    month: 1,
    day: 23,
    category: 'National Day',
    description: 'National day of valor commemorating the birth anniversary of Netaji Subhas Chandra Bose.',
  },
  {
    id: 'fix_jan_24',
    name: 'National Girl Child Day',
    month: 1,
    day: 24,
    category: 'National Day',
    description: 'Promoting empowerment, education, and equal rights for every girl child.',
  },
  {
    id: 'fix_jan_24_edu',
    name: 'International Day of Education',
    month: 1,
    day: 24,
    category: 'International Observance',
    description: "Celebrating education's essential role in peace, equity, and human development.",
  },
  {
    id: 'fix_jan_25_voters',
    name: "National Voters' Day",
    month: 1,
    day: 25,
    category: 'National Day',
    description: 'Encouraging democratic participation and honoring the Election Commission of India.',
  },
  {
    id: 'fix_jan_26_republic',
    name: 'Republic Day of India',
    month: 1,
    day: 26,
    category: 'National Day',
    description: 'Celebrating the enactment of the Constitution of India in 1950, transitioning India into an independent republic.',
  },
  {
    id: 'fix_jan_30_martyrs',
    name: "Martyrs' Day (Shaheed Diwas)",
    month: 1,
    day: 30,
    category: 'National Day',
    description: 'Solemn tribute to Mahatma Gandhi and all freedom fighters who laid down their lives for the nation.',
  },

  // --- FEBRUARY ---
  {
    id: 'fix_feb_02',
    name: 'World Wetlands Day',
    month: 2,
    day: 2,
    category: 'Awareness Day',
    description: 'Highlighting the vital role of wetlands for people, clean water, biodiversity, and our planet.',
  },
  {
    id: 'fix_feb_04',
    name: 'World Cancer Day',
    month: 2,
    day: 4,
    category: 'Awareness Day',
    description: 'Uniting the world to raise awareness, improve education, and catalyze personal and government action.',
  },
  {
    id: 'fix_feb_21',
    name: 'International Mother Language Day',
    month: 2,
    day: 21,
    category: 'International Observance',
    description: 'Promoting linguistic and cultural diversity and multilingualism worldwide.',
  },
  {
    id: 'fix_feb_28',
    name: 'National Science Day',
    month: 2,
    day: 28,
    category: 'National Day',
    description: 'Commemorating the discovery of the Raman Effect by Sir C.V. Raman in 1928.',
  },

  // --- MARCH ---
  {
    id: 'fix_mar_03',
    name: 'World Wildlife Day',
    month: 3,
    day: 3,
    category: 'Awareness Day',
    description: 'Celebrating the unique roles and contributions of wild fauna and flora to ecology and human livelihoods.',
  },
  {
    id: 'fix_mar_08',
    name: "International Women's Day",
    month: 3,
    day: 8,
    category: 'International Observance',
    description: "Global day celebrating the social, economic, cultural, and political achievements of women.",
  },
  {
    id: 'fix_mar_20',
    name: 'International Day of Happiness',
    month: 3,
    day: 20,
    category: 'International Observance',
    description: 'Recognizing the importance of happiness and well-being as universal goals and aspirations in human lives.',
  },
  {
    id: 'fix_mar_21',
    name: 'World Forest Day & World Poetry Day',
    month: 3,
    day: 21,
    category: 'International Observance',
    description: 'Honoring the beauty of verse and the essential life-giving ecosystems of the world’s forests.',
  },
  {
    id: 'fix_mar_22',
    name: 'World Water Day',
    month: 3,
    day: 22,
    category: 'Awareness Day',
    description: 'Focusing attention on the importance of freshwater and advocating for the sustainable management of freshwater resources.',
  },

  // --- APRIL ---
  {
    id: 'fix_apr_07',
    name: 'World Health Day',
    month: 4,
    day: 7,
    category: 'International Observance',
    description: 'Marking the founding of the World Health Organization, drawing worldwide attention to global health priorities.',
  },
  {
    id: 'fix_apr_14_ambedkar',
    name: 'Dr. B.R. Ambedkar Jayanti',
    month: 4,
    day: 14,
    category: 'National Day',
    description: 'Birth anniversary of Babasaheb Ambedkar, principal architect of the Indian Constitution, social reformer, and champion of equality.',
  },
  {
    id: 'fix_apr_22',
    name: 'Earth Day',
    month: 4,
    day: 22,
    category: 'International Observance',
    description: 'Global environmental movement dedicated to protecting planet Earth, biodiversity, and clean air and water.',
  },
  {
    id: 'fix_apr_23',
    name: 'World Book and Copyright Day',
    month: 4,
    day: 23,
    category: 'Cultural Event',
    description: 'Celebrating books, reading, authors, and the power of literature to link past and future.',
  },

  // --- MAY ---
  {
    id: 'fix_may_01',
    name: "International Workers' Day",
    month: 5,
    day: 1,
    category: 'Public Holiday',
    description: 'Commemorating the historic struggles and gains made by workers and the labor movement.',
  },
  {
    id: 'fix_may_03',
    name: 'World Press Freedom Day',
    month: 5,
    day: 3,
    category: 'International Observance',
    description: 'Celebrating the fundamental principles of press freedom and defending the media from attacks on their independence.',
  },
  {
    id: 'fix_may_15',
    name: 'International Day of Families',
    month: 5,
    day: 15,
    category: 'International Observance',
    description: 'Highlighting the importance of families, solidarity, and supportive communities.',
  },
  {
    id: 'fix_may_31',
    name: 'World No Tobacco Day',
    month: 5,
    day: 31,
    category: 'Awareness Day',
    description: 'Highlighting the health and other risks associated with tobacco use.',
  },

  // --- JUNE ---
  {
    id: 'fix_jun_05',
    name: 'World Environment Day',
    month: 6,
    day: 5,
    category: 'International Observance',
    description: 'Global platform for inspiring positive change toward caring for nature, wildlife, and natural resources.',
  },
  {
    id: 'fix_jun_08',
    name: 'World Oceans Day',
    month: 6,
    day: 8,
    category: 'International Observance',
    description: 'Reminding everyone of the major role oceans have in everyday life as the lungs of our planet.',
  },
  {
    id: 'fix_jun_21_yoga',
    name: 'International Day of Yoga',
    month: 6,
    day: 21,
    category: 'Cultural Event',
    description: 'Celebrated worldwide to cultivate mindful living, wellness, holistic harmony, and peaceful balance.',
  },
  {
    id: 'fix_jun_21_music',
    name: 'World Music Day (Fête de la Musique)',
    month: 6,
    day: 21,
    category: 'Cultural Event',
    description: 'Free celebration of music across genres, uniting communities through melody and rhythm.',
  },

  // --- JULY ---
  {
    id: 'fix_jul_01',
    name: "National Doctor's Day",
    month: 7,
    day: 1,
    category: 'National Day',
    description: 'Honoring physicians and healthcare professionals on the birth and death anniversary of Dr. Bidhan Chandra Roy.',
  },
  {
    id: 'fix_jul_11',
    name: 'World Population Day',
    month: 7,
    day: 11,
    category: 'International Observance',
    description: 'Focusing attention on the urgency and importance of population and development issues.',
  },
  {
    id: 'fix_jul_26',
    name: 'Kargil Vijay Diwas',
    month: 7,
    day: 26,
    category: 'National Day',
    description: 'Commemorating the success of Operation Vijay and honoring the brave soldiers of the Indian Armed Forces.',
  },

  // --- AUGUST ---
  {
    id: 'fix_aug_12',
    name: 'International Youth Day',
    month: 8,
    day: 12,
    category: 'International Observance',
    description: 'Recognizing youth as key partners in peace, development, and meaningful social innovation.',
  },
  {
    id: 'fix_aug_15',
    name: 'Independence Day of India',
    month: 8,
    day: 15,
    category: 'National Day',
    description: 'Celebrating the nation’s independence in 1947 with gratitude to all freedom fighters and visionary leaders.',
  },
  {
    id: 'fix_aug_19',
    name: 'World Photography Day',
    month: 8,
    day: 19,
    category: 'Cultural Event',
    description: 'Celebrating the art, craft, science, and history of capturing still moments.',
  },
  {
    id: 'fix_aug_29',
    name: 'National Sports Day',
    month: 8,
    day: 29,
    category: 'National Day',
    description: 'Commemorating the birth anniversary of legendary hockey maestro Major Dhyan Chand.',
  },

  // --- SEPTEMBER ---
  {
    id: 'fix_sep_05',
    name: "Teachers' Day (India)",
    month: 9,
    day: 5,
    category: 'National Day',
    description: 'Honoring teachers, educators, and mentors on the birth anniversary of Dr. Sarvepalli Radhakrishnan.',
  },
  {
    id: 'fix_sep_05_charity',
    name: 'International Day of Charity',
    month: 9,
    day: 5,
    category: 'International Observance',
    description: "Commemorating Mother Teresa's passing and promoting selfless charitable acts.",
  },
  {
    id: 'fix_sep_08',
    name: 'International Literacy Day',
    month: 9,
    day: 8,
    category: 'International Observance',
    description: 'Highlighting literacy as a matter of dignity and human rights across communities.',
  },
  {
    id: 'fix_sep_14',
    name: 'Hindi Diwas',
    month: 9,
    day: 14,
    category: 'National Day',
    description: 'Celebrating the adoption of Hindi as an official language of the Union of India in 1949.',
  },
  {
    id: 'fix_sep_15',
    name: "National Engineers' Day",
    month: 9,
    day: 15,
    category: 'National Day',
    description: 'Tribute to Sir M. Visvesvaraya on his birth anniversary, celebrating innovation and civic engineering.',
  },
  {
    id: 'fix_sep_16',
    name: 'World Ozone Day',
    month: 9,
    day: 16,
    category: 'Awareness Day',
    description: 'Commemorating the signing of the Montreal Protocol for the preservation of the atmospheric ozone layer.',
  },
  {
    id: 'fix_sep_17_vishwakarma',
    name: 'Vishwakarma Puja',
    month: 9,
    day: 17,
    category: 'Hindu Festival',
    description: 'Honoring Lord Vishwakarma, divine architect and craftsman, celebrated by creators, engineers, and artisans.',
  },
  {
    id: 'fix_sep_21',
    name: 'International Day of Peace',
    month: 9,
    day: 21,
    category: 'International Observance',
    description: 'Devoted to strengthening the ideals of peace, non-violence, and understanding among all peoples.',
  },
  {
    id: 'fix_sep_27',
    name: 'World Tourism Day',
    month: 9,
    day: 27,
    category: 'Cultural Event',
    description: 'Fostering awareness of the social, cultural, political, and economic value of sustainable travel.',
  },
  {
    id: 'fix_sep_29',
    name: 'World Heart Day',
    month: 9,
    day: 29,
    category: 'Awareness Day',
    description: 'Informing people around the world about cardiovascular health and healthy habits.',
  },

  // --- OCTOBER ---
  {
    id: 'fix_oct_01',
    name: 'International Day of Older Persons',
    month: 10,
    day: 1,
    category: 'International Observance',
    description: 'Honoring senior citizens, wisdom, and intergenerational connection.',
  },
  {
    id: 'fix_oct_02',
    name: 'Mahatma Gandhi Jayanti & Lal Bahadur Shastri Jayanti',
    month: 10,
    day: 2,
    category: 'National Day',
    description: 'Celebrating the birth anniversaries of Mahatma Gandhi (International Day of Non-Violence) and Lal Bahadur Shastri.',
  },
  {
    id: 'fix_oct_05',
    name: "World Teachers' Day",
    month: 10,
    day: 5,
    category: 'International Observance',
    description: 'Honoring education champions worldwide and the transforming role of educators.',
  },
  {
    id: 'fix_oct_08',
    name: 'Indian Air Force Day',
    month: 10,
    day: 8,
    category: 'National Day',
    description: 'Commemorating the establishment of the Indian Air Force in 1932.',
  },
  {
    id: 'fix_oct_10',
    name: 'World Mental Health Day',
    month: 10,
    day: 10,
    category: 'Awareness Day',
    description: 'Raising awareness of mental health issues and mobilizing efforts in support of mental well-being.',
  },
  {
    id: 'fix_oct_11',
    name: 'International Day of the Girl Child',
    month: 10,
    day: 11,
    category: 'International Observance',
    description: 'Amplifying the voices and rights of girls everywhere.',
  },
  {
    id: 'fix_oct_16',
    name: 'World Food Day',
    month: 10,
    day: 16,
    category: 'Awareness Day',
    description: 'Promoting global awareness and action for those who suffer from hunger and for healthy diets for all.',
  },
  {
    id: 'fix_oct_24',
    name: 'United Nations Day',
    month: 10,
    day: 24,
    category: 'International Observance',
    description: 'Marking the anniversary of the entry into force of the UN Charter in 1945.',
  },
  {
    id: 'fix_oct_31',
    name: 'National Unity Day (Rashtriya Ekta Diwas)',
    month: 10,
    day: 31,
    category: 'National Day',
    description: 'Commemorating the birth anniversary of Sardar Vallabhbhai Patel, unifier of India.',
  },

  // --- NOVEMBER ---
  {
    id: 'fix_nov_11',
    name: 'National Education Day',
    month: 11,
    day: 11,
    category: 'National Day',
    description: "Birth anniversary of Maulana Abul Kalam Azad, independent India's first Minister of Education.",
  },
  {
    id: 'fix_nov_14',
    name: "Children's Day (Bal Diwas)",
    month: 11,
    day: 14,
    category: 'National Day',
    description: 'Birth anniversary of Pandit Jawaharlal Nehru, celebrating the joy, rights, and potential of children.',
  },
  {
    id: 'fix_nov_15_birsa',
    name: 'Birsa Munda Jayanti (Janjatiya Gaurav Divas)',
    month: 11,
    day: 15,
    category: 'National Day',
    description: 'Honoring the legendary tribal leader and freedom fighter Bhagwan Birsa Munda.',
  },
  {
    id: 'fix_nov_26_const',
    name: 'Constitution Day of India (Samvidhan Divas)',
    month: 11,
    day: 26,
    category: 'National Day',
    description: 'Commemorating the adoption of the Constitution of India by the Constituent Assembly in 1949.',
  },

  // --- DECEMBER ---
  {
    id: 'fix_dec_01',
    name: 'World AIDS Day',
    month: 12,
    day: 1,
    category: 'Awareness Day',
    description: 'Dedicated to raising awareness, remembering those who have died, and supporting healthcare access.',
  },
  {
    id: 'fix_dec_04',
    name: 'Indian Navy Day',
    month: 12,
    day: 4,
    category: 'National Day',
    description: 'Celebrating the achievements and bravery of the Indian Naval forces.',
  },
  {
    id: 'fix_dec_10',
    name: 'Human Rights Day',
    month: 12,
    day: 10,
    category: 'International Observance',
    description: 'Commemorating the UN Universal Declaration of Human Rights in 1948.',
  },
  {
    id: 'fix_dec_22',
    name: 'National Mathematics Day',
    month: 12,
    day: 22,
    category: 'National Day',
    description: 'Celebrating the birth anniversary of legendary mathematical genius Srinivasa Ramanujan.',
  },
  {
    id: 'fix_dec_23',
    name: "National Farmers' Day (Kisan Diwas)",
    month: 12,
    day: 23,
    category: 'National Day',
    description: 'Expressing gratitude to the agrarian community on the birth anniversary of Chaudhary Charan Singh.',
  },
  {
    id: 'fix_dec_25_xmas',
    name: 'Christmas Day',
    month: 12,
    day: 25,
    category: 'Religious Observance',
    description: 'Celebrating peace, goodwill to all, kindness, and the birth of Jesus Christ.',
  },
  {
    id: 'fix_dec_25_gov',
    name: 'Good Governance Day',
    month: 12,
    day: 25,
    category: 'National Day',
    description: 'Commemorating the birth anniversary of former Prime Minister Atal Bihari Vajpayee.',
  },

  // =========================================================================
  // 2026 MOVABLE / LUNISOLAR / TRADITIONAL FESTIVALS
  // =========================================================================
  {
    id: '2026_shivaratri',
    name: 'Maha Shivaratri',
    year: 2026,
    month: 2,
    day: 15,
    category: 'Hindu Festival',
    description: 'The auspicious Great Night of Lord Shiva, celebrated with meditation, fasting, and devotional contemplation.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_holika',
    name: 'Holika Dahan',
    year: 2026,
    month: 3,
    day: 3,
    category: 'Hindu Festival',
    description: 'Traditional evening bonfire celebrating the victory of pure devotion over demonic forces.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_holi',
    name: 'Holi (Festival of Colors)',
    year: 2026,
    month: 3,
    day: 4,
    category: 'Hindu Festival',
    description: 'Joyous festival of colors, music, renewal, forgiveness, and spring celebrations.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_ugadi',
    name: 'Ugadi / Gudi Padwa / Cheti Chand',
    year: 2026,
    month: 3,
    day: 19,
    category: 'Hindu Festival',
    description: 'Lunisolar New Year marked by raising the Gudi in Maharashtra and tasting six-flavored Ugadi Pachadi in the Deccan.',
    traditionOrRegion: 'South / West India',
  },
  {
    id: '2026_eid_fitr',
    name: 'Eid al-Fitr',
    year: 2026,
    month: 3,
    day: 20,
    category: 'Religious Observance',
    description: 'Celebration concluding Ramadan with community prayers, feasts, family visits, and acts of charity.',
    traditionOrRegion: 'Islamic',
  },
  {
    id: '2026_ram_navami',
    name: 'Rama Navami',
    year: 2026,
    month: 3,
    day: 27,
    category: 'Hindu Festival',
    description: 'Sacred day commemorating the appearance of Lord Rama, the ideal king and upholder of truth and righteousness.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_mahavir',
    name: 'Mahavir Jayanti',
    year: 2026,
    month: 3,
    day: 31,
    category: 'Religious Observance',
    description: 'Celebrating the birth anniversary of Lord Mahavira, 24th Tirthankara of Jainism, preaching Ahimsa and compassion.',
    traditionOrRegion: 'Jain',
  },
  {
    id: '2026_good_friday',
    name: 'Good Friday',
    year: 2026,
    month: 4,
    day: 3,
    category: 'Religious Observance',
    description: 'Solemn Christian holy day commemorating the passion and crucifixion of Jesus Christ.',
    traditionOrRegion: 'Christian',
  },
  {
    id: '2026_easter',
    name: 'Easter Sunday',
    year: 2026,
    month: 4,
    day: 5,
    category: 'Religious Observance',
    description: 'Celebration of hope, renewal, and the resurrection of Jesus Christ.',
    traditionOrRegion: 'Christian',
  },
  {
    id: '2026_hanuman',
    name: 'Hanuman Jayanti',
    year: 2026,
    month: 4,
    day: 2,
    category: 'Hindu Festival',
    description: 'Birth celebration of Lord Hanuman, embodiment of courage, selfless devotion, and strength.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_akshaya',
    name: 'Akshaya Tritiya',
    year: 2026,
    month: 4,
    day: 20,
    category: 'Hindu Festival',
    description: 'Auspicious day of eternal wealth, new beginnings, charitable gifts, and prosperity.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_buddha_purnima',
    name: 'Buddha Purnima (Vesak)',
    year: 2026,
    month: 5,
    day: 1,
    category: 'Religious Observance',
    description: 'Triple blessed day commemorating the birth, enlightenment, and Mahaparinirvana of Gautama Buddha.',
    traditionOrRegion: 'Buddhist',
  },
  {
    id: '2026_eid_adha',
    name: 'Eid al-Adha (Bakrid)',
    year: 2026,
    month: 5,
    day: 27,
    category: 'Religious Observance',
    description: 'Feast of sacrifice commemorating Ibrahim’s obedience, marked by communal prayers and charitable meat distribution.',
    traditionOrRegion: 'Islamic',
  },
  {
    id: '2026_muharram',
    name: 'Muharram (Ashura)',
    year: 2026,
    month: 6,
    day: 17,
    category: 'Religious Observance',
    description: 'Solemn observance of the tenth day of Muharram commemorating the martyrdom of Imam Hussain at Karbala.',
    traditionOrRegion: 'Islamic',
  },
  {
    id: '2026_ratha_yatra',
    name: 'Jagannath Ratha Yatra',
    year: 2026,
    month: 7,
    day: 16,
    category: 'Hindu Festival',
    description: 'Grand chariot procession of Lord Jagannath, Balabhadra, and Subhadra to the Gundicha Temple in Puri.',
    traditionOrRegion: 'East / Pan-India',
  },
  {
    id: '2026_guru_purnima',
    name: 'Guru Purnima (Vyasa Purnima)',
    year: 2026,
    month: 7,
    day: 29,
    category: 'Hindu Festival',
    description: 'Expressing deep reverence and gratitude to spiritual masters, teachers, and Maharishi Veda Vyasa.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_raksha_bandhan',
    name: 'Raksha Bandhan',
    year: 2026,
    month: 8,
    day: 28,
    category: 'Hindu Festival',
    description: 'Celebration of sibling bond, protection, prayers, and affection signified by tying the sacred thread (Rakhi).',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_janmashtami',
    name: 'Krishna Janmashtami',
    year: 2026,
    month: 9,
    day: 4,
    category: 'Hindu Festival',
    description: 'Celebration of the birth of Lord Krishna, with midnight pujas, devotional bhajans, and Dahi Handi festivities.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_ganesh_chaturthi',
    name: 'Ganesh Chaturthi',
    year: 2026,
    month: 9,
    day: 14,
    category: 'Hindu Festival',
    description: 'Welcoming Lord Ganesha, the remover of obstacles and lord of wisdom, with vibrant community pandals and modaks.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_anant_chaturdashi',
    name: 'Anant Chaturdashi (Ganesh Visarjan)',
    year: 2026,
    month: 9,
    day: 24,
    category: 'Hindu Festival',
    description: 'Grand culmination of Ganeshotsav with music, devotion, and sacred immersion processions.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_navratri',
    name: 'Shardiya Navratri Begins',
    year: 2026,
    month: 10,
    day: 11,
    category: 'Hindu Festival',
    description: 'Nine sacred days of devotion, Garba/Dandiya dance, and worshipping the nine divine forms of Maa Durga.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_durga_ashtami',
    name: 'Maha Ashtami / Durga Puja',
    year: 2026,
    month: 10,
    day: 19,
    category: 'Hindu Festival',
    description: 'Pinnacle of Durga Puja celebrating the triumph of Mother Durga over evil and darkness.',
    traditionOrRegion: 'East / Pan-India',
  },
  {
    id: '2026_dussehra',
    name: 'Dussehra (Vijayadashami)',
    year: 2026,
    month: 10,
    day: 20,
    category: 'Hindu Festival',
    description: 'Victory of righteousness over evil, celebrated with Ravan Dahan, blessing tools, and starting noble ventures.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_karwa_chauth',
    name: 'Karwa Chauth',
    year: 2026,
    month: 10,
    day: 29,
    category: 'Hindu Festival',
    description: 'Traditional fast observed with devotion for the longevity, health, and happiness of life partners.',
    traditionOrRegion: 'North / West India',
  },
  {
    id: '2026_dhanteras',
    name: 'Dhanteras',
    year: 2026,
    month: 11,
    day: 6,
    category: 'Hindu Festival',
    description: 'Joyous beginning of Diwali festivities honoring Lord Dhanvantari, health, and auspicious metal purchases.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_naraka_chaturdashi',
    name: 'Naraka Chaturdashi (Chhoti Diwali)',
    year: 2026,
    month: 11,
    day: 7,
    category: 'Hindu Festival',
    description: 'Early morning oil baths, festive lights, and sweets celebrating the elimination of darkness.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_diwali',
    name: 'Diwali (Deepavali - Lakshmi Puja)',
    year: 2026,
    month: 11,
    day: 8,
    category: 'Hindu Festival',
    description: 'The glorious Festival of Lights celebrating the victory of light over darkness, home illuminations, and Lakshmi Puja.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_govardhan',
    name: 'Govardhan Puja / Annakut',
    year: 2026,
    month: 11,
    day: 9,
    category: 'Hindu Festival',
    description: 'Honoring Mother Nature, gratitude for food crops, and Lord Krishna’s protection of all living beings.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_bhai_dooj',
    name: 'Bhai Dooj',
    year: 2026,
    month: 11,
    day: 10,
    category: 'Hindu Festival',
    description: 'Celebrating the sacred bond between siblings with blessings, sweets, and gifts.',
    traditionOrRegion: 'Pan-India',
  },
  {
    id: '2026_chhath',
    name: 'Chhath Puja',
    year: 2026,
    month: 11,
    day: 15,
    category: 'Hindu Festival',
    description: 'Ancient Vedic festival expressing deep gratitude to Lord Surya (Sun God) and Chhathi Maiya at riverbanks.',
    traditionOrRegion: 'North / East India',
  },
  {
    id: '2026_guru_nanak',
    name: 'Guru Nanak Gurpurab',
    year: 2026,
    month: 11,
    day: 24,
    category: 'Religious Observance',
    description: 'Prakash Utsav honoring the founder of Sikhism and his eternal teachings of equality, peace, and service.',
    traditionOrRegion: 'Sikh',
  },
];

/**
 * Returns all events occurring on the specified date.
 * @param year 4-digit calendar year
 * @param month 1-12
 * @param day 1-31
 */
export const getEventsForDate = (
  year: number,
  month: number,
  day: number
): NudgeEvent[] => {
  return ALL_EVENTS.filter((e) => {
    if (e.month !== month || e.day !== day) return false;
    return e.year === undefined || e.year === null || e.year === year;
  });
};

/**
 * Returns all events occurring within a specified month.
 * @param year 4-digit calendar year
 * @param month 1-12
 */
export const getEventsForMonth = (
  year: number,
  month: number
): NudgeEvent[] => {
  return ALL_EVENTS.filter((e) => {
    if (e.month !== month) return false;
    return e.year === undefined || e.year === null || e.year === year;
  });
};

/**
 * Quick check if any events occur on the specified date.
 */
export const hasEventOnDate = (
  year: number,
  month: number,
  day: number
): boolean => {
  return ALL_EVENTS.some((e) => {
    if (e.month !== month || e.day !== day) return false;
    return e.year === undefined || e.year === null || e.year === year;
  });
};
