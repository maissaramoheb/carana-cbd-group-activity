/**
 * CARANA Scenario Repository
 * Official UNPOL Job-Specific Training (JST) on Capacity-Building and Development (CBD)
 * Lesson 1: Situational Analysis - Galasi Criminal Investigations Services (CIS)
 * Contains the complete 57 paragraphs, official 5x6 matrix definitions, and Annex D expected outcomes.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CARANA_SCENARIO = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const AREAS = [
    {
      id: 'policing_services',
      name: '1. Policing Services / Professionalism',
      subcategories: [
        { id: 'knowledge_skills', name: 'Knowledge and Skills' },
        { id: 'command_control', name: 'Command and Control' }
      ]
    },
    {
      id: 'enabling_services',
      name: '2. Enabling Services',
      subcategories: [
        { id: 'human_resources', name: 'Human Resources' },
        { id: 'budgeting', name: 'Budgeting' },
        { id: 'logistics', name: 'Logistics' }
      ]
    },
    {
      id: 'policy_legal',
      name: '3. Policy / Legal Framework',
      subcategories: [
        { id: 'police_law_act', name: 'Police Law / Act' },
        { id: 'police_policy', name: 'Police Policy' }
      ]
    },
    {
      id: 'accountability_mechanisms',
      name: '4. Accountability Mechanisms',
      subcategories: [
        { id: 'internal_oversight', name: 'Internal Oversight' },
        { id: 'external_oversight', name: 'External Oversight' },
        { id: 'code_conduct_discipline', name: 'Code of Conduct and Disciplinary Measures' }
      ]
    },
    {
      id: 'stakeholder_management',
      name: '5. Stakeholder Management',
      subcategories: [
        { id: 'engagement', name: 'Engagement' },
        { id: 'coordination', name: 'Coordination' },
        { id: 'donor_management', name: 'Donor Management' }
      ]
    }
  ];

  const DIMENSIONS = [
    { id: 'policing_practice', name: '1. Policing Practice', short: 'Policing Practice' },
    { id: 'environmental_sustainability', name: '2. Environmental Sustainability', short: 'Environmental' },
    { id: 'conflict_prevention', name: '3. Conflict Prevention', short: 'Conflict Prev.' },
    { id: 'human_rights', name: '4. Human Rights', short: 'Human Rights' },
    { id: 'gender', name: '5. Gender', short: 'Gender' },
    { id: 'cpoc', name: '6. Comprehensive Protection of Civilians', short: 'CPOC' }
  ];

  const BACKGROUND = [
    {
      id: 1,
      text: 'You have been assigned as the responsible UNPOL CBD adviser to the Galasi Criminal Investigations Services (CIS). You have basic knowledge about the Carana National Police (CNP) and police in the capital.'
    },
    {
      id: 2,
      text: 'In Galasi, there is a disproportionate victimisation of women, children, and members of ethnic minorities. The LGBTTQI community members do not report crimes against them, as they are afraid to approach the police. Crimes against these minorities have been neglected and publicly denied with references to statistics that do not show a relevant number of cases. Predominant crime patterns include prevalent crimes related to SGBV, drug-abuse, social unrest, and riot-related crimes. The rates of violent crime and homicide have significantly increased due to the availability of small arms and comparable weapons.'
    },
    {
      id: 3,
      text: "The strength of the CNP is about 7,200. Roughly 500 officers are females. The officer per citizen ratio is close to 1:2000. The ratio is better in Carana's capital and the capital region than in rural areas. Galasi has an estimated population of 3,000,000 (incl. IDPs). Galasi Police Department (PD) is estimated at 2,500 police officers of which ca. 150 are female. The CIS in Galasi is 250 officers (12 female) strong. Officers working in the CIS are exclusively of Falin ethnicity."
    },
    {
      id: 4,
      text: 'The CIS is charged with investigative tasks that include criminal offences such as theft, violent extremism, burglaries, arson, homicide, and cases of SGBV as well as civil offences. Environmental offences are generally neglected. The CIS is also commissioned with cooperation with other national and international law enforcement agencies. CIS in Carana is highly decentralised. There is little specialist support for investigations from a centralised agency. This is also true for the CIS in Galasi. Apart from cases that are related to violent extremism, there is no structured division into specialised units. The assignment of cases takes place on the basis of availability and personal preference.'
    },
    {
      id: 5,
      text: 'As you begin your assignment as CBD adviser, you intend to improve your knowledge base about the Galasi CIS. You talk to several persons and stakeholders whose contacts have been provided to you by your colleagues from UNAC. You also receive various reports on the Galasi PD as well as a recent community perception survey. As you engage your newly acquired sources and read the documents, you gather numerous pieces of information:'
    }
  ];

  const PARAGRAPHS = [
    {
      id: 6,
      text: 'Procurement is centralised at the staff department for finance. Galasi CIS has no influence regarding the procurement process. Procurement generally does not meet the requirements as identified by CIS.'
    },
    {
      id: 7,
      text: 'The policy for arrest and detention is outdated. It is based on colonial-style statutory law for apprehension and use of force. Also, there is no policy on asset seizure, confiscation, and recovery.'
    },
    {
      id: 8,
      text: 'CIS regularly undergoes reorganisation often related to changes on the political level, which triggers changes on the leadership level. There have been 2 larger overhauls of the CIS within the last 5 years, not counting smaller organisational adjustments.'
    },
    {
      id: 9,
      text: 'Galasi PD lacks an understanding of intelligence-led policing practices.'
    },
    {
      id: 10,
      text: 'Recruitment, transfers, and promotion processes lack transparency; salary and allowances vary and are irregular. There is a significant remuneration disparity amongst officers of the same level, especially between men and women.'
    },
    {
      id: 11,
      text: 'The relation to public prosecutors and judiciary is minimal as there is a natural resistance within the CIS culture to cooperate with organisations outside CNP. Prosecutors are generally perceived as arrogant and bossy, claiming ownership of the investigation processes. This description appears to be part of a cultural clash based on an "us against them" attitude. The CIS\'s perspective is that prosecutors do not handle the files correctly and do not obtain enough sentences, etc. At the same time prosecutors openly complain about a lack of professionalism within CIS. Presumably, CIS does not follow protocol, which leads to cases being thrown out in court for procedural reasons.'
    },
    {
      id: 12,
      text: 'Performance measurement takes place in a traditional ad-hoc basis. Successful operations often have an immediate impact on career paths. Failure to perform is not addressed systematically. Personal consequences are often related to a mixture of favouritism and opportunity.'
    },
    {
      id: 13,
      text: 'Maintenance systems for infrastructure and equipment are not in place. Quick reactions to upcoming issues would allow a response in ways that are resource efficient. The waste of resources, even to a gross extent, does not trigger any response from leadership or other responsible units of the organisation.'
    },
    {
      id: 14,
      text: 'Human rights complaints, as they reach the CIS, are not followed up systematically, but only when there is sufficient external pressure, especially through the international community.'
    },
    {
      id: 15,
      text: 'POC is considered as the prerogative of the military. CNP does not have its own policies regarding POC but rather adapts military concepts and procedures to address POC situations.'
    },
    {
      id: 16,
      text: 'Due to the shared ethnicity with local communities, there is a strong connection to community leaders and elders who are easily accessible to CIS leadership and some CIS officers. Women in local communities have a comparatively strong position due to local culture. This aspect remains unused as there are not enough female officers in the CIS and even fewer female officers in (respected) leadership positions.'
    },
    {
      id: 17,
      text: 'CIS does not make use of media to address communities and does not have a media relations unit of its own.'
    },
    {
      id: 18,
      text: 'Galasi PD does not provide a policy on whistle-blowers.'
    },
    {
      id: 19,
      text: 'An initiative to improve the percentage of female officers in the CIS has not led to an increase in numbers. The reason reported was a lack of potential applicants. Another reason given was that CIS officers are recruited from the uniformed police units of CNP. The number of female officers in CIS would increase, but that would lead to a corresponding decrease in CNP, which was not considered a good trade-off.'
    },
    {
      id: 20,
      text: 'Galasi PD has no awareness of the impact of its work on the environment, e.g., waste management.'
    },
    {
      id: 21,
      text: 'The Carana political system possesses no established system for democratic oversight. Tools such as parliamentary inquiries are not utilised due to a lack of willingness and ability in the legislative branch.'
    },
    {
      id: 22,
      text: 'Interest groups within the police interfere in investigation procedures – potentially for the benefit of personal agendas.'
    },
    {
      id: 23,
      text: 'CIS leadership has strong ties to the dominant political party; there is no policy that prohibits political-economic affiliation and collaboration of CNP leadership.'
    },
    {
      id: 24,
      text: "CIS's forensic capabilities are very limited. There is no certified laboratory for serological tests, no specialised personnel for surveillance tasks and a lack of surveillance and electronic monitoring equipment. Electronic monitoring is done irregularly by other government entities for unknown reasons. There are no standardised procedures for this type of investigation."
    },
    {
      id: 25,
      text: 'Currently there is no process involving relevant stakeholders in addressing identified professional gaps, e.g., legislators, national human rights institution, civil society organizations, etc.'
    },
    {
      id: 26,
      text: 'Operational costs for CIS are not defined in the annual budget. The costs are covered through a central operational budget that is shared with the Public Security Department.'
    },
    {
      id: 27,
      text: 'Police complaints are handled on a case-by-case basis. Citizens face problems to file complaints as there is no unit/entity that is responsible to address complaints.'
    },
    {
      id: 28,
      text: 'As part of its engagement regarding Common Foreign and Security Policy (CFSP), the European Union is currently engaged in financing various training activities in the region, also targeting LEAs in Carana and its neighbouring countries. Trainings offered aim to increase competence in investigating organised crime and violent extremism. The training offered is highly sophisticated and fully complies with international standards.'
    },
    {
      id: 29,
      text: 'CIS has an investigative function for all Galasi PD to counter impunity. There are no standard practices for this task and no dedicated officers. Reporting on these investigations goes through the regular chain of command.'
    },
    {
      id: 30,
      text: 'CIS is not open to cooperating with national human rights institution (ombudsman) or human rights attorneys as CIS sees no role for these actors in the cases they investigate.'
    },
    {
      id: 31,
      text: 'Police interest groups are not well organised in Carana. There are no registered police unions.'
    },
    {
      id: 32,
      text: 'CIS officers are not required to inform victims of sexual violence about potential preventive measures, e.g., where to get support (social services, NGOs) to leave the violent environment.'
    },
    {
      id: 33,
      text: 'Interviewing techniques and other investigative methods are not regularly checked regarding their lawfulness.'
    },
    {
      id: 34,
      text: 'Within CIS, registers exist on a per-unit basis. There is no centralised database nor an interface with databases outside Galasi PD.'
    },
    {
      id: 35,
      text: 'Two bilateral donors announced their intention to start criminal investigations initiatives for the CNP as part of their national foreign policy agendas. The law enforcement sectors in these donor countries feature highly complex and developed systems, providing them with the ability to offer state-of-the-art equipment support programmes and exclusive training on investigation matters, such as informant handling, covered observations, and high-end technical support processes.'
    },
    {
      id: 36,
      text: 'CIS works largely disconnected from uniformed police in Galasi, who engage with the local communities on a day-to-day basis. This practice does not yield a flow of information on the potential of crime prevention strategies and POC prevention activities or available tools, such as early warning mechanisms, cooperation with social services and private entities that offer support for endangered groups/minorities.'
    },
    {
      id: 37,
      text: 'CIS does not use a regular instructive mechanism nor a compliance system on standard operations and conduct expected from CNP officers.'
    },
    {
      id: 38,
      text: 'Crime-induced riots take place in Galasi. They tend to transform into ethnic conflicts, targeting minorities in Galasi (looting, beatings, and killings in extreme cases). These situations are regarded as public order management issues. CIS regularly does not engage in operations addressing riots and does not initiate investigations into occurring crimes, claiming that it is a waste of resources due to minimal chances of identifying perpetrators on an individual basis.'
    },
    {
      id: 39,
      text: 'UNODC is about to launch a training programme targeting investigators of criminal networks. It focuses on financial investigations and the use of tools such as Analyst Notebook and Palantir, i.e., tools for investigations of complex criminal structures.'
    },
    {
      id: 40,
      text: 'The Code of Conduct was suspended as it is outdated and was not followed. A review of the Code of Conduct was announced, but there is no ongoing process.'
    },
    {
      id: 41,
      text: "CIS has no policy concerning female officers' career progression and retention."
    },
    {
      id: 42,
      text: 'To the detriment of those victims who require protection the most (e.g., women, children, and disabled persons), victim and witness protection mechanisms are not in place.'
    },
    {
      id: 43,
      text: 'CIS rejects cooperation with journalists, perceiving them as nosy and disruptive to their work. CIS redirects requests and inquiries to Galasi PD Chief of Staff.'
    },
    {
      id: 44,
      text: "CIS does not acknowledge the right of civil society to be informed in rejecting initiatives to increase transparency of police work. Officers in CIS commonly refer to the necessity to keep the investigation process and methods confidential in order not to jeopardise the outcomes. Hence, no relationship with civil society organizations, including women's, minority, LGBTTQI, and persons with disabilities organizations and advocates, exists."
    },
    {
      id: 45,
      text: 'No criminal investigations education or advanced training is available to CIS officers. Recent training offered by the international community neglected the needs of CIS.'
    },
    {
      id: 46,
      text: 'International gender-related training that is available is not fitted toward criminal investigators.'
    },
    {
      id: 47,
      text: 'CNP training does not include courses on human rights, SGBV, the use of force, child protection or STI/HIV/AIDS awareness or prevention.'
    },
    {
      id: 48,
      text: 'Galasi PD lacks equipment and infrastructure management as well as requirements forecast. So, there is no management of short-, middle- and long-term impact of procurement. Certainly, procurement does not include the aspect of gender-sensitivity.'
    },
    {
      id: 49,
      text: "Criminal statistics are not generated on a regular basis. Data is being collected ad-hoc when requested by CNP leadership or by the political level. Data collection is conducted manually with pen and paper. Data is generally not disaggregated by sex or age, etc. There is no data collection on CNP's use of force, arrest, and comparable enforcement actions."
    },
    {
      id: 50,
      text: 'As data is occasionally collected, data quality remains questionable. Internationally observed and criticised crimes detection rates can reach high values, up to 100 %. Victimisation surveys conducted by international observers, such as NGOs, suggest that severe portions of these crimes go unreported. Human rights lawyers allege that CNP does not register these crimes due to high risks of the crimes not being solved.'
    },
    {
      id: 51,
      text: 'The Galasi PD does not have an independent external police complaint mechanism.'
    },
    {
      id: 52,
      text: 'A duty of care initiative, which had been introduced by a police interest group, was initially welcomed but has not been followed up due to an asserted lack of resources in CNP.'
    },
    {
      id: 53,
      text: 'Citizens in Galasi are not informed of possible responses to police misconduct. Consequently, there is no deterrent effect of facing informed citizens. As has been alleged by human rights organisations, misconduct committed by CNP in Galasi regularly targets ethnic minorities and specifically women within these minorities. CNP has been blamed for utilizing the lack of information on the side of the civilian population to evade charges against its officers. Misconduct committed by CNP officers has triggered demonstrations – peaceful as well as violent ones – in the past.'
    },
    {
      id: 54,
      text: 'A group of UN member States under the umbrella of Interpol initiated a multilateral project called "Police Support for Galasi" for the Galasi PD, with multiple initiatives, including (1) human rights training focused on the prevention of human rights violations, (2) workshops to review the legal framework and policies to introduce best practices from around the world and (3) draft SOPs concerning the Galasi PD\'s approach to mainstreaming human rights and gender perspective into their policing practices. The reception of this initiative amongst Galasi PD\'s leadership was diverse. CIS leadership was quite receptive while leadership of other departments was very reserved, even undermining the process. The reactions could be related to personal history and potential impact on individual careers and aspirations.'
    },
    {
      id: 55,
      text: 'An NGO pushes for the introduction of standards and practices for the Carana public administration for the efficient use of natural resources (power, gasoline, fresh water), procurement of commodities and consumables from environmentally sensitive suppliers, and proper waste management (e.g., plastic bottles).'
    },
    {
      id: 56,
      text: 'Galasi police leadership does not perceive criminal investigations as an integral part of POC-related operations and other CNP activities as it is regarded as a matter of physical protection, i.e., business of the uniformed police, especially riot control units and the military. Therefore, leadership does not hold CIS accountable for actions taken or omitted for offences related to riots as outlined above and other systematic criminal actions targeting minorities to forcefully displace them to other parts of the country.'
    },
    {
      id: 57,
      text: 'Recruitment of police officers is aimed at the Falin majority. This leads to a lack of interest and compassion, both on the organisational and the individual level for the security situation of minorities.'
    }
  ];

  const DEFAULT_STAKEHOLDERS = [
    {
      id: 'sh-1',
      name: 'Galasi CIS Leadership (Head of CIS)',
      role: 'Owner',
      influence: 'High',
      interest: 'High',
      needs: 'Prestige, institutional standing, career advancement, donor support.',
      strategy: 'Engage closely & influence actively: Build consultative partnership, involve in all assessments, align CBD with his priorities.'
    },
    {
      id: 'sh-2',
      name: 'Galasi Police Department (PD) Leadership / CoS',
      role: 'Influencer',
      influence: 'High',
      interest: 'Medium',
      needs: 'Authority, media relations control, avoiding public embarrassment from police misconduct.',
      strategy: 'Keep satisfied: Maintain regular briefings, clarify CIS advisory boundaries, avoid institutional conflict.'
    },
    {
      id: 'sh-3',
      name: 'Public Prosecutors & Judiciary',
      role: 'Enabler',
      influence: 'High',
      interest: 'Medium',
      needs: 'Professional case files, chain of custody adherence, legal protocol compliance, prosecutable cases.',
      strategy: 'Engage closely: Establish joint police-prosecution case review sessions to break "us against them" culture.'
    },
    {
      id: 'sh-4',
      name: 'Community Leaders & Elders',
      role: 'Enabler',
      influence: 'Medium',
      interest: 'High',
      needs: 'Protection of communities, fair treatment, direct line to police leadership without extortion.',
      strategy: 'Engage closely: Leverage shared Falin cultural connection while expanding trust to minority elders.'
    },
    {
      id: 'sh-5',
      name: 'Women & Ethnic Minority Groups (Galasi Civil Society)',
      role: 'Affected group',
      influence: 'Low',
      interest: 'High',
      needs: 'Effective protection, safety reporting SGBV, ending police impunity and ethnic discrimination.',
      strategy: 'Keep informed & show consideration: Create safe reporting channels, involve female leaders, build witness safeguards.'
    },
    {
      id: 'sh-6',
      name: 'Interpol / Police Support for Galasi Project',
      role: 'Enabler',
      influence: 'High',
      interest: 'High',
      needs: 'Successful multilateral project execution, human rights mainstreaming, SOP adoption.',
      strategy: 'Engage closely & coordinate: Harmonise UNPOL CBD activities with Interpol training and SOP reviews to prevent duplication.'
    },
    {
      id: 'sh-7',
      name: 'UNODC (Criminal Networks Training)',
      role: 'Enabler',
      influence: 'Medium',
      interest: 'High',
      needs: 'Trained investigators in financial crimes and intelligence analysis tools.',
      strategy: 'Coordinate closely: Ensure candidates selected for UNODC courses are retained and deployed in CIS analytical roles.'
    },
    {
      id: 'sh-8',
      name: 'Dominant Political Party / Legislative Branch',
      role: 'Potential blocker',
      influence: 'High',
      interest: 'Low',
      needs: 'Maintain political influence, protect partisan allies in police leadership.',
      strategy: 'Keep satisfied & monitor: Sensitize on long-term benefits of professional non-partisan policing under RoL.'
    }
  ];

  return {
    AREAS,
    DIMENSIONS,
    BACKGROUND,
    PARAGRAPHS,
    DEFAULT_STAKEHOLDERS,
    getParagraph: function (id) {
      return PARAGRAPHS.find(p => p.id === id) || BACKGROUND.find(p => p.id === id);
    }
  };
});
