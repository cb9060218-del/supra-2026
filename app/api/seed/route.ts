import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TEAMS_SEED = [
  {num:"EV-01", name:"Amrita Racing"},
  {num:"EV-02", name:"Team Nequit Electric"},
  {num:"EV-04", name:"Acceleracers Electric"},
  {num:"EV-05", name:"Pegasus Racing Electric"},
  {num:"EV-06", name:"Veerracerss Electric"},
  {num:"EV-07", name:"Veloce Racing Electric"},
  {num:"EV-10", name:"NIT-B Racing"},
  {num:"EV-14", name:"4ZE Racing"},
  {num:"EV-15", name:"Phoenix Racing Electric"},
  {num:"EV-16", name:"Invincibles"},
  {num:"EV-18", name:"CRCE Formula Racing Electric"},
  {num:"EV-19", name:"Team Fateh"},
  {num:"EV-20", name:"Team Defianz Racing Electric"},
  {num:"ICV-01", name:"Team Abhedya Racers"},
  {num:"ICV-02", name:"Praheti Racing"},
  {num:"ICV-03", name:"Madbolt Formula Racing"},
  {num:"ICV-04", name:"Sahayadri Formula Racers"},
  {num:"ICV-05", name:"Team Srijan"},
  {num:"ICV-06", name:"Team Godavari"},
  {num:"ICV-07", name:"Team Mechnext Racing"},
  {num:"ICV-08", name:"DSCE Motorsports"},
  {num:"ICV-09", name:"Ares Motorsports"},
  {num:"ICV-10", name:"Team Adrenaline Racing"},
  {num:"ICV-11", name:"Team Malaviyans"},
  {num:"ICV-12", name:"The Elite Racers"},
  {num:"ICV-13", name:"Yodha Racing"},
  {num:"ICV-15", name:"Team Brahmastra Formula"},
  {num:"ICV-17", name:"Bullz Racing"},
  {num:"ICV-19", name:"Wrench Wielders Racing"},
  {num:"ICV-20", name:"Javitron Racing"},
  {num:"ICV-22", name:"Godspeed Racing"},
  {num:"ICV-23", name:"Team VITian Formula Racing"},
  {num:"ICV-24", name:"Team Vegadooth Racing"},
  {num:"ICV-25", name:"Overdrive Racing"},
  {num:"ICV-26", name:"Team Eminent Racing"},
  {num:"ICV-29", name:"Team Ashwamedh"},
  {num:"ICV-30", name:"GTU Motorsports"},
  {num:"ICV-31", name:"Yeti Racing"},
  {num:"ICV-32", name:"Hadron Motorsports"},
  {num:"ICV-33", name:"Team Acceleracers ICV"},
  {num:"ICV-34", name:"Team Infinity Racers"},
  {num:"ICV-36", name:"Team Saranyu Racing"},
  {num:"ICV-37", name:"PetronARC"},
  {num:"ICV-38", name:"IIITDMJ Racing"},
  {num:"ICV-39", name:"Force Racing"},
  {num:"ICV-40", name:"Camber Racing"},
  {num:"ICV-42", name:"Team Arion"},
  {num:"ICV-43", name:"Team Lightning"},
  {num:"ICV-44", name:"Team Thrusters"},
  {num:"ICV-45", name:"Team Screwdrivers"},
  {num:"ICV-46", name:"Tarkshya Racing"},
  {num:"ICV-47", name:"Devbhoomi Dynamo"},
  {num:"ICV-49", name:"XLR8 Formula Student Team"},
  {num:"ICV-50", name:"Hermes Racing"},
  {num:"ICV-51", name:"Speedtail Racing"},
  {num:"ICV-53", name:"Formula Team Pegasus"},
  {num:"ICV-55", name:"AIOUS Formula Student"},
  {num:"ICV-56", name:"Pravega Racing"},
  {num:"ICV-57", name:"Vishwaracers"},
  {num:"ICV-58", name:"Team Sakthi Racing"},
  {num:"ICV-59", name:"Velocita Racing"}
];

const STICKER_SPONSORS_SEED = [
  {company_name:"MSIL", sticker_size:"Large (15x15cm)"},
  {company_name:"BPCL", sticker_size:"Medium (12x10cm)"},
  {company_name:"Dassault Systems", sticker_size:"7x7cm"},
  {company_name:"Munjal Kiriu", sticker_size:"7x7cm"},
  {company_name:"ICAT", sticker_size:"7x7cm"},
  {company_name:"JK Tyre", sticker_size:"7x7cm"}
];

const SPONSORS_SEED = [
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000001', sponsor_name: 'MSIL', sponsor_tier: 'principal', sponsorship_amount: 3000000, payment_status: 'Payment Received', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000002', sponsor_name: 'Envision India', sponsor_tier: 'other', sponsor_tier_label: 'EV Zone Sponsor', sponsorship_amount: 700000, payment_status: 'Payment Received', notes: 'Showcase F1 vehicle' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', sponsor_name: 'BPCL', sponsor_tier: 'gold', sponsor_tier_label: 'Gold Sponsor', sponsorship_amount: 700000, payment_status: 'Pending', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000004', sponsor_name: 'Dassault Systems', sponsor_tier: 'silver', sponsorship_amount: 500000, payment_status: 'Pending', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000005', sponsor_name: 'Munjal Kiriu', sponsor_tier: 'silver', sponsorship_amount: 500000, payment_status: 'Pending', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000006', sponsor_name: 'ICAT', sponsor_tier: 'silver', sponsorship_amount: 500000, payment_status: 'Payment Received', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000007', sponsor_name: 'JK Tyre', sponsor_tier: 'silver', sponsorship_amount: 500000, payment_status: 'Pending', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000008', sponsor_name: 'Ansys', sponsor_tier: 'bronze', sponsorship_amount: 300000, payment_status: 'Pending', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000009', sponsor_name: 'AVL', sponsor_tier: 'bronze', sponsorship_amount: 300000, payment_status: 'Pending', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000010', sponsor_name: 'CEAT', sponsor_tier: 'bronze', sponsorship_amount: 300000, payment_status: 'Payment Received', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000011', sponsor_name: 'MRF', sponsor_tier: 'bronze', sponsorship_amount: 300000, payment_status: 'Pending', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000012', sponsor_name: 'Validate', sponsor_tier: 'bronze', sponsorship_amount: 300000, payment_status: 'Pending', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000013', sponsor_name: 'APOLLO', sponsor_tier: 'bronze', sponsorship_amount: 300000, payment_status: 'Pending', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000014', sponsor_name: 'ETAS', sponsor_tier: 'bronze', sponsorship_amount: 250000, payment_status: 'Pending', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', sponsor_name: 'Migatronic', sponsor_tier: 'bronze', sponsor_tier_label: 'Bronze · Hot Pit Partner', sponsorship_amount: 200000, payment_status: 'Pending', notes: 'Hot Pit Partner' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000016', sponsor_name: 'EKA Mobility', sponsor_tier: 'other', sponsor_tier_label: 'Customised Sponsor', sponsorship_amount: 100000, payment_status: 'Pending', notes: '-' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000017', sponsor_name: 'KIET', sponsor_tier: 'other', sponsor_tier_label: 'Host Partner', sponsorship_amount: 0, payment_status: '-', notes: 'Hostel facility for volunteers' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000018', sponsor_name: 'Morphine Motorsports', sponsor_tier: 'other', sponsor_tier_label: 'Kit Partner', sponsorship_amount: 0, payment_status: '-', notes: 'SUPRA kits' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000019', sponsor_name: 'ETAuto', sponsor_tier: 'other', sponsor_tier_label: 'Media Partner', sponsorship_amount: 0, payment_status: '-', notes: 'Media coverage' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000020', sponsor_name: 'AutoCar', sponsor_tier: 'other', sponsor_tier_label: 'Media Partner', sponsorship_amount: 0, payment_status: '-', notes: 'Media coverage' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000021', sponsor_name: 'EV Tech News', sponsor_tier: 'other', sponsor_tier_label: 'Media Partner', sponsorship_amount: 0, payment_status: '-', notes: 'Media coverage' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000022', sponsor_name: 'ARAI', sponsor_tier: 'other', sponsor_tier_label: 'Supporting Partner', sponsorship_amount: 0, payment_status: '-', notes: 'Support' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000023', sponsor_name: 'ACMA', sponsor_tier: 'other', sponsor_tier_label: 'Supporting Partner', sponsorship_amount: 0, payment_status: '-', notes: 'Support' },
  { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000024', sponsor_name: 'General Guests', sponsor_tier: 'other', sponsor_tier_label: 'Not sponsoring', sponsorship_amount: 0, payment_status: '-', notes: '-' }
];

const GUESTS_SEED = [
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000020', guest_name: 'Mukul', designation: '-', email: 'mukul.kumar@autocarindia.com', phone: '98736 43293', remarks: 'Need to check', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000020', guest_name: 'Kiran', designation: '-', email: 'kiran.murali@autocarindia.com', phone: '97464 11023', remarks: 'Need to check', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000019', guest_name: 'Ms. Arushi Rawat', designation: 'Principal Correspondent', email: 'arushi.rawat@timesinternet.in', phone: '96542 29841', remarks: 'Need to check', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000019', guest_name: 'Himanshu Rautela', designation: 'Camera Person', email: 'himanshu.rautela@timesinternet.in', phone: '-', remarks: 'Need to check', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000019', guest_name: 'Sudeep Kumar', designation: '-', email: 'sudeep.kumar@timesinternet.in', phone: '-', remarks: 'Need to check — few more will join with him', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000008', guest_name: 'Mayank Dwivedi', designation: 'Senior App. Engineer, Synopsys', email: 'm.dwivedi@synopsys.com', phone: '63669 49284', remarks: '2–5 Sep (need to check)', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000008', guest_name: 'Rohit Sangwan', designation: 'Senior App. Engineer, Synopsys', email: 'rohit.sangwan@arkinfo.in', phone: '89204 79290', remarks: '2–5 Sep (need to check)', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000008', guest_name: 'Arindam Pal', designation: 'Application Engineer, CADFEM', email: 'arindam.p@cadfem.ai', phone: '80932 80021', remarks: '2–5 Sep (need to check)', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000008', guest_name: 'Vishal Ganore', designation: 'Academic Program Manager, Synopsys', email: 'Not provided', phone: '80077 29958', remarks: '2–5 Sep (need to check)', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000008', guest_name: 'Arup Tyagi', designation: 'Sr. Manager – Academic Programs, ASEAN, Synopsys', email: 'aroop@synopsys.com', phone: '96501 33552', remarks: '5 Sep', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000012', guest_name: 'Amit Kumar Mehta', designation: 'Director Technical', email: 'amitkumar.mehta@validateindia.com', phone: '99109 96179', remarks: '5 Sep', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000012', guest_name: 'Irshad Ahmad', designation: 'Manager', email: 'irshad.ahmad@validateindia.com', phone: '99993 26820', remarks: '2–5 Sep (need to check)', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000012', guest_name: 'Srishti Sharma', designation: '-', email: 'sharshtee.sharma@validateindia.com', phone: '92117 48800', remarks: '2–5 Sep (need to check)', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000023', guest_name: 'Shardool Singh', designation: 'Regional Secretary – North', email: 'shardool.singh@acma.in', phone: 'Not provided', remarks: '3 Sep', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000023', guest_name: 'Mayank Nigam', designation: 'Dy. Director', email: 'mayank.nigam@acma.in', phone: '97111 59124', remarks: '3 Sep', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000023', guest_name: 'Jairaj Kumar', designation: 'Asst. Director', email: 'jairaj.kumar@acma.in', phone: '98734 79790', remarks: '3 Sep', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000023', guest_name: 'Hemant Kumar', designation: 'Executive Officer', email: 'hemant.kumar@acma.in', phone: '88607 91948', remarks: '3 Sep', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000005', guest_name: 'Ashish Jindal', designation: 'AVP', email: 'ajindal@munjalkiriu.co.in', phone: '99711 49417', remarks: '2–5 Sep (need to check)', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000005', guest_name: 'Virender Singh Thakur', designation: 'GM', email: 'vsthakur@munjalkiriu.co.in', phone: '98103 59859', remarks: '2–5 Sep (need to check)', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000005', guest_name: 'Soutan Patra', designation: 'AM', email: 'marketing@munjalkiriu.co.in', phone: '95470 45057', remarks: '2–5 Sep (need to check)', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000018', guest_name: 'Azmat Hussain', designation: 'Founder and Director', email: 'director@gomorphine.com', phone: '84607 06779', remarks: '31 Aug – 5 Sep', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000018', guest_name: 'Yash Agrawal', designation: 'Co-founder and Director', email: 'mms@gomorphine.com', phone: '90219 83311', remarks: '31 Aug – 5 Sep', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000018', guest_name: 'Ritanshu Vishwakarma', designation: 'Operations Manager', email: 'vishwakarmaritanshu@gmail.com', phone: '93593 34153', remarks: '31 Aug – 5 Sep', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', guest_name: 'Amol Bhosale', designation: '-', email: 'amolb@bharatpetroleum.in', phone: '-', remarks: '9 May 2026 (as entered — please confirm)', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', guest_name: 'Mukherjee Sourav', designation: '-', email: 'souravm@bharatpetroleum.in', phone: '-', remarks: '9 May 2026 (as entered — please confirm)', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', guest_name: 'Pardeep Goyal', designation: 'Business Head (Retail)', email: 'pardeepg@bharatpetroleum.in', phone: '-', remarks: 'Need to check', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', guest_name: 'Gorav', designation: 'CGM, Marketing (Retail)', email: 'gorav@bharatpetroleum.in', phone: '-', remarks: 'Need to check', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', guest_name: 'Charu Yadav', designation: 'Head, Customer Experience (Retail)', email: 'yadavc@bharatpetroleum.in', phone: '-', remarks: 'Need to check', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', guest_name: 'Sameet Pai', designation: 'CGM Finance (Retail)', email: 'sameetpai@bharatpetroleum.in', phone: '-', remarks: 'Need to check', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', guest_name: 'Achman Trehan', designation: 'Head Retail North', email: 'trehanaah@bharatpetroleum.in', phone: '-', remarks: 'Need to check', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', guest_name: 'Amol Bhosale (State Head)', designation: 'State Head (Retail), UP West & Uttarakhand', email: 'amolb@bharatpetroleum.in', phone: '-', remarks: 'Need to check', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', guest_name: 'Thomas Mathew', designation: 'AGM – Automation & Application', email: 'thomas@migatronic.in', phone: '81309 12380', remarks: '1–5 Sep 2026', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', guest_name: 'Harsh Vardhan Jain', designation: 'Head – Automation & Application', email: 'hvjain@migatronic.in', phone: '99719 98257', remarks: '2–5 Sep 2026', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', guest_name: 'Sameer Ansari', designation: 'Sr. Service Engineer', email: 'sameer@migatronic.in', phone: '70117 24899', remarks: '1–5 Sep 2026', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', guest_name: 'Dharmender', designation: 'Service Engineer', email: 'dharmender@migatronic.in', phone: '90271 55676', remarks: '1–5 Sep 2026', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', guest_name: 'Harsh Vardhan Tyagi', designation: 'GM – North', email: 'harsh@migatronic.in', phone: '99719 98258', remarks: '9 May 2026 (as entered — please confirm)', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', guest_name: 'Varun Mukhi', designation: 'RM – North & East', email: 'varun@migatronic.in', phone: '99719 98260', remarks: '9 May 2026 (as entered — please confirm)', attendance_status: 'pending' },
  { sponsor_id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', guest_name: 'Manu Gulati', designation: 'CEO, Migatronic India', email: 'manu@migatronic.in', phone: '99719 98256', remarks: '9 May 2026 (as entered — please confirm)', attendance_status: 'pending' }
];

const CUBICLES_SEED = [
  { category: "stall", company_name: "envision gold stall" },
  { category: "stall", company_name: "BPCL" },
  { category: "stall", company_name: "MORPHINE" },
  { category: "stall", company_name: "MEGATRONIC" },
  { category: "stickers", company_name: "MSIL 15*15" },
  { category: "stickers", company_name: "BPCL 12*10" },
  { category: "stickers", company_name: "DASSAULT 7*7" },
  { category: "stickers", company_name: "MUNJAL 7*7" },
  { category: "stickers", company_name: "ICAT 7*7" },
  { category: "stickers", company_name: "JK TYERS 7*7" }
];

const TIER_BENEFITS: Record<string, string[]> = {
  principal: ["Stall setup 18x3 mtr","Event branding in company name","Student engagement (webinars/training)","Official seat at valedictory","Non-track branding — 25 spots","Branding on student vehicles (large)","Database of participating teams","Lunch/refreshments for officials","Logo on website/event site/valedictory","Promotional activities onsite","Materials in student kits","Award cheque & trophy branding","Customized branding options","Participation in HR meet"],
  platinum: ["Stall setup 9x3 mtr","Student engagement (webinars/training)","Official seat at valedictory","Non-track branding — 15 spots","Branding on student vehicles (medium)","Database of participating teams","Lunch/refreshments for officials","Logo on website/event site/valedictory","Promotional activities onsite","Materials in student kits","Award cheque & trophy branding","Customized branding options","Participation in HR meet"],
  gold: ["Stall setup 6x3 mtr","Student engagement (webinars/training)","Non-track branding — 15 spots","Branding on student vehicles (medium)","Database of participating teams","Lunch/refreshments for officials","Logo on website/event site/valedictory","Promotional activities onsite","Materials in student kits","Award cheque & trophy branding","Customized branding options","Participation in HR meet"],
  lunch: ["Stall setup 4x3 mtr","Student engagement (webinars/training)","Non-track branding — 10 spots","Branding on student vehicles (7x7cm)","Database of participating teams","Lunch/refreshments for officials","Logo on website/event site/valedictory","Promotional activities onsite","Materials in student kits","Award cheque & trophy branding","Customized branding options","Participation in HR meet"],
  silver: ["Stall setup 3x3 mtr","Student engagement (webinars/training)","Non-track branding — 10 spots","Branding on student vehicles (7x7cm)","Database of participating teams","Lunch/refreshments for officials","Logo on website/event site/valedictory","Promotional activities onsite","Materials in student kits","Award cheque & trophy branding","Customized branding options","Participation in HR meet"],
  bronze: ["Non-track branding — 5 spots","Lunch/refreshments for officials","Logo on website/event site/valedictory","Promotional activities onsite","Materials in student kits","Award cheque & trophy branding","Customized branding options","Participation in HR meet"],
  other: ["Lunch/refreshments for officials","Logo on website/event site/valedictory","Promotional activities onsite","Materials in student kits","Participation in HR meet"]
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const requestUrl = new URL(request.url);
  const reset = requestUrl.searchParams.get("reset") === "true";

  if (reset) {
    console.log("Forcing database reset...");
    await supabase.from("guests").delete().neq("guest_name", "FORCE_DELETE_ALL");
    await supabase.from("sponsor_benefits").delete().neq("benefit_name", "FORCE_DELETE_ALL");
    await supabase.from("sponsors").delete().neq("sponsor_name", "FORCE_DELETE_ALL");
    await supabase.from("teams").delete().neq("name", "FORCE_DELETE_ALL");
    await supabase.from("sticker_companies").delete().neq("company_name", "FORCE_DELETE_ALL");
    await supabase.from("fulfillment_items").delete().neq("company_name", "FORCE_DELETE_ALL");
  }

  // 1. Seed sponsors if empty
  const { count: sponsorsCount } = await supabase
    .from("sponsors")
    .select("id", { count: "exact", head: true });

  if (!sponsorsCount || sponsorsCount === 0) {
    await supabase.from("sponsors").insert(SPONSORS_SEED);
  }

  // 2. Seed guests if empty
  const { count: guestsCount } = await supabase
    .from("guests")
    .select("id", { count: "exact", head: true });

  if (!guestsCount || guestsCount === 0) {
    await supabase.from("guests").insert(GUESTS_SEED);
  }

  // 3. Seed teams if empty
  const { count: teamsCount } = await supabase
    .from("teams")
    .select("num", { count: "exact", head: true });

  if (!teamsCount || teamsCount === 0) {
    const teamsToInsert = TEAMS_SEED.map(t => ({ num: t.num, name: t.name }));
    await supabase.from("teams").insert(teamsToInsert);
  }

  // 4. Seed sticker companies if empty
  const { count: stickerCount } = await supabase
    .from("sticker_companies")
    .select("id", { count: "exact", head: true });

  if (!stickerCount || stickerCount === 0) {
    await supabase.from("sticker_companies").insert(STICKER_SPONSORS_SEED);
  }

  // 5. Seed fulfillment items if empty
  const { count: fulfillmentCount } = await supabase
    .from("fulfillment_items")
    .select("id", { count: "exact", head: true });

  if (!fulfillmentCount || fulfillmentCount === 0) {
    await supabase.from("fulfillment_items").insert(CUBICLES_SEED);
  }

  // 6. Seed sponsor benefits if empty
  const { count: benefitsCount } = await supabase
    .from("sponsor_benefits")
    .select("id", { count: "exact", head: true });

  if (!benefitsCount || benefitsCount === 0) {
    const { data: fetchedSponsors } = await supabase
      .from("sponsors")
      .select("id, sponsor_tier");

    if (fetchedSponsors) {
      const benefitsToInsert: any[] = [];
      fetchedSponsors.forEach((sp) => {
        const tier = (sp.sponsor_tier || "other").toLowerCase();
        const list = TIER_BENEFITS[tier] || TIER_BENEFITS.other;
        list.forEach((b) => {
          benefitsToInsert.push({
            sponsor_id: sp.id,
            benefit_name: b,
            status: "pending"
          });
        });
      });

      if (benefitsToInsert.length > 0) {
        await supabase.from("sponsor_benefits").insert(benefitsToInsert);
      }
    }
  }

  return NextResponse.json({
    status: "success",
    message: "Database seeded successfully",
    counts: {
      sponsors: sponsorsCount,
      guests: guestsCount,
      teams: teamsCount,
      sticker_companies: stickerCount,
      fulfillment_items: fulfillmentCount,
      sponsor_benefits: benefitsCount
    }
  });
}
