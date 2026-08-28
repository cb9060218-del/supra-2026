import React from "react";
import { createClient } from "@/lib/supabase/server";
import StickersView from "@/components/stickers/StickersView";

export const revalidate = 0; // Disable caching to fetch live checkbox states

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

export default async function StickersPage() {
  const supabase = await createClient();

  // 1. Fetch Competing Teams list
  let { data: teams } = await supabase
    .from("teams")
    .select("num, name")
    .order("num", { ascending: true });

  if (!teams || teams.length === 0) {
    const teamsToInsert = TEAMS_SEED.map(t => ({ num: t.num, name: t.name }));
    await supabase.from("teams").insert(teamsToInsert);
    const { data: refetchedTeams } = await supabase
      .from("teams")
      .select("num, name")
      .order("num", { ascending: true });
    teams = refetchedTeams;
  }

  // 2. Fetch Sticker Companies
  let { data: companies } = await supabase
    .from("sticker_companies")
    .select("id, company_name, sticker_size")
    .order("company_name", { ascending: true });

  if (!companies || companies.length === 0) {
    await supabase.from("sticker_companies").insert(STICKER_SPONSORS_SEED);
    const { data: refetchedCompanies } = await supabase
      .from("sticker_companies")
      .select("id, company_name, sticker_size")
      .order("company_name", { ascending: true });
    companies = refetchedCompanies;
  }

  // 3. Fetch Placement statuses
  const { data: placements } = await supabase
    .from("sticker_placements")
    .select("company_id, team_number, is_placed");

  // 4. Fetch Overall Sticker check status
  const { data: overallStatus } = await supabase
    .from("team_sticker_status")
    .select("team_number, is_placed");

  // 5. Get User Role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = "viewer";
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile) userRole = profile.role;
  }

  return (
    <StickersView
      initialTeams={teams || []}
      initialCompanies={companies || []}
      initialPlacements={placements || []}
      initialOverallStatus={overallStatus || []}
      userRole={userRole}
    />
  );
}
