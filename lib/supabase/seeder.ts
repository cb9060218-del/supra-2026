import { SupabaseClient } from "@supabase/supabase-js";

export async function seedDatabase(supabase: SupabaseClient) {
  // Check count and verify if MSIL is present
  const { count } = await supabase
    .from("sponsors")
    .select("id", { count: "exact", head: true });

  const { data: msil } = await supabase
    .from("sponsors")
    .select("id")
    .eq("sponsor_name", "MSIL")
    .maybeSingle();

  // If the database has dirty or incomplete data, force re-seed to get the exact data
  if (count !== 24 || !msil) {
    console.log("Database has dirty/incomplete sponsors count. Resetting and seeding exact data...");
    
    // Clear existing to avoid primary/foreign key constraint conflicts
    await supabase.from("guests").delete().neq("guest_name", "FORCE_DELETE_ALL");
    await supabase.from("sponsors").delete().neq("sponsor_name", "FORCE_DELETE_ALL");

    // 1. Seed the exact 24 sponsors
    const sponsorsSeed = [
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
      { id: 'a0e0a0e0-a0e0-4a0e-a0e0-000000000024', sponsor_name: 'General Guests', sponsor_tier: 'general', sponsor_tier_label: 'Not sponsoring', sponsorship_amount: 0, payment_status: '-', notes: '-' }
    ];

    await supabase.from("sponsors").insert(sponsorsSeed);

    // 2. Seed the exact 38 guests linked to the sponsors
    const guestsSeed = [
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

    await supabase.from("guests").insert(guestsSeed);
    console.log("Seeding complete!");
  }
}
