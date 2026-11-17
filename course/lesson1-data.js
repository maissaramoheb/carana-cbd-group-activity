/* CARANA CBD E-Learning — instructional material based on UNPOL CBD JST Lesson 1
 * Source: JSTC_CBD_L01_LP_Situational Analysis_072023.pdf (2021 JST curriculum / 07-2023 file)
 * Adapted learning text; not an official United Nations digital course.
 * Do not include facilitator-only Annex D expected outcomes in learner screens.
 */
window.CARANA_LESSON1 = {
  id: "situational-analysis",
  title: "Situational Analysis",
  subtitle: "Understand the environment before designing change",
  source: "UNPOL Job-Specific Training on Capacity-Building and Development, Lesson 1 (2021; PDF dated 07/2023)",
  objectives: [
    "Explain why evidence-based situational analysis must precede reform planning",
    "Differentiate conflict, response, and CBD analysis",
    "Apply PESTEL-S and recognise complementary conflict-analysis tools",
    "Identify stakeholders, interests, influence, and engagement requirements",
    "Classify issues against the five CBD areas and six cross-cutting dimensions",
    "Identify SWOT entry points and construct a defensible baseline"
  ],
  sections: [
    {
      title: "Start with the situation",
      duration: "7–10 min",
      screens: [
        {
          title: "The decision before the decision",
          kicker: "The adviser’s first responsibility",
          lead: "Imagine arriving in fictional Galasi. A counterpart asks you to deliver an investigation-skills course immediately. Is training already the right response?",
          points: [
            "A visible performance problem does not establish its underlying cause.",
            "Examine the mission context, existing assistance, and counterpart capability before selecting an intervention.",
            "Improvement begins with understanding the current, evidence-supported state."
          ],
          takeaway: "Diagnose before prescribing.",
          visualTitle: "A disciplined entry point",
          visual: ["Observed concern", "Evidence and context", "Verified problem", "Potential CBD response"],
          sourcePage: "1, 4–5"
        },
        {
          title: "Three lenses, one coherent diagnosis",
          kicker: "Analyses serve different purposes",
          lead: "Situational analysis is not a single checklist. The lesson combines three mutually informative perspectives.",
          points: [
            "Conflict analysis: what political, socioeconomic, legal, security and other dynamics shape the environment?",
            "Response analysis: which organisations and actors are already intervening, and how?",
            "CBD analysis: how does the counterpart actually operate, and what capacities, structures and constraints exist?"
          ],
          takeaway: "Context → existing responses → counterpart reality.",
          visualTitle: "The analytical sequence",
          visual: ["1 · Conflict", "2 · Response", "3 · CBD"],
          sourcePage: "1–2, 5, 9, 11"
        },
        {
          title: "Establish your starting point",
          kicker: "Why evidence matters",
          lead: "Without an accurate starting point, improvement claims cannot be tested later.",
          points: [
            "Differentiate what people believe is happening from what evidence supports.",
            "Preserve both qualitative observations and quantitative measures.",
            "A baseline is a reference for later progress assessment—not a target or an activity list."
          ],
          takeaway: "You cannot credibly measure change without a baseline.",
          visualTitle: "From evidence to evaluation",
          visual: ["As-is condition", "CBD intervention", "Later observation", "Comparison"],
          sourcePage: "1, 5, 19"
        }
      ],
      quiz: [
        {q:"A counterpart reports weak investigations and asks for training. What should the CBD adviser do first?",options:["Approve the course immediately","Gather evidence and examine underlying constraints","Set a target number of trained officers","Draft a transition plan"],answer:1,why:"Training is one possible intervention; the curriculum places systematic analysis first."},
        {q:"Which analytical lens asks who is already active in the reform environment?",options:["Response analysis","Baseline comparison","Stakeholder scorecard only","Implementation review"],answer:0,why:"Response analysis identifies existing actors, programmes, motivations and possible overlap."},
        {q:"Which statement best describes the purpose of a baseline?",options:["It is the future target","It proves the chosen intervention will work","It documents the initial state for later comparison","It replaces the need for evaluation"],answer:2,why:"A baseline captures the as-is state and makes later evaluation possible."},
        {q:"Conflict analysis primarily helps the adviser understand:",options:["Only the police hierarchy","The wider political, socioeconomic, legal and security environment","The final training budget","Only individual officer competencies"],answer:1,why:"Conflict analysis addresses the wider operating context, not only internal police functions."},
        {q:"Which sequence is consistent with evidence-based CBD?",options:["Activity → objective → analysis","Target → procurement → report","Analysis → identified gaps → informed response","Training → baseline → diagnose"],answer:2,why:"The starting situation and identified gaps should inform any later response."},
        {q:"A narrative description of an existing case-file process can be a baseline component.",options:["False; only numerical data qualify","True; qualitative and quantitative information can be used","Only if an end-state target is already met","Only if collected by an external consultant"],answer:1,why:"The lesson recognises numerical indicators and qualitative descriptions as baseline evidence."}
      ]
    },
    {
      title: "Read the conflict environment",
      duration: "8–12 min",
      screens: [
        {
          title: "Structure the context with PESTEL-S",
          kicker: "Conflict analysis",
          lead: "PESTEL-S is the lesson’s organising framework for reviewing broad contextual drivers.",
          points: [
            "Political, Economic and Social factors shape incentives, institutions and trust.",
            "Technological, Environmental and Legal factors affect service delivery and legitimate authority.",
            "Security is the additional lens of particular importance in conflict and post-conflict settings."
          ],
          takeaway: "Do not confuse a contextual scan with a complete conflict analysis.",
          visualTitle: "Seven dimensions",
          visual: ["Political","Economic","Social","Technological","Environmental","Legal","Security"],
          sourcePage: "6–7"
        },
        {
          title: "Read systems, not just symptoms",
          kicker: "Extend the analysis",
          lead: "The lesson identifies additional methods for understanding conflict dynamics where the context requires them.",
          points: [
            "Actor mapping may examine power and interests as well as positions, interests and needs (PIN).",
            "Conflict trees, escalation analysis, and needs/fears mapping explore causal relationships.",
            "The CBD adviser need not personally complete every comprehensive analysis, but must understand its implications and seek the required expertise."
          ],
          takeaway: "Use complementary methods when PESTEL-S alone cannot explain the situation.",
          visualTitle: "Complementary methods",
          visual: ["Actor / PIN mapping","Conflict tree","Escalation analysis","Needs and fears"],
          sourcePage: "6–7"
        },
        {
          title: "Law and institutional context matter",
          kicker: "Interpret before importing solutions",
          lead: "An effective reform in one jurisdiction may not transfer directly into another.",
          points: [
            "Different legal traditions affect the powers, duties and safeguards of law enforcement.",
            "Statutory law, administrative policy and local practice must be distinguished.",
            "Political incentives, SSR structures, culture and resources shape what changes are legitimate, feasible and sustainable."
          ],
          takeaway: "Never assume a familiar policing model is automatically transferable.",
          visualTitle: "Local-fit test",
          visual: ["Lawful?","Contextually relevant?","Locally owned?","Feasible?"],
          sourcePage: "2, 8"
        }
      ],
      quiz: [
        {q:"What does the final S in PESTEL-S represent in this curriculum?",options:["Strategy","Security","Sustainability","Staffing"],answer:1,why:"Security is explicitly added to PESTEL for conflict and post-conflict settings."},
        {q:"Which item is NOT a PESTEL-S category?",options:["Legal","Technological","Individual training hours","Environmental"],answer:2,why:"Training hours are a possible operational measure, not one of the seven contextual categories."},
        {q:"An adviser is exploring actors' stated positions, underlying interests and needs. Which model fits?",options:["PIN","SWOT only","Logframe","KPI variance"],answer:0,why:"PIN stands for Position, Interest and Need."},
        {q:"Which is a justified use of a conflict tree?",options:["Automatically rank staff performance","Explore underlying and resulting conflict factors","Certify a programme's success","Replace all stakeholder dialogue"],answer:1,why:"A conflict tree can help unpack drivers and consequences."},
        {q:"Should every CBD adviser personally complete a full conflict analysis?",options:["Yes, without external inputs","No; understand links, request or facilitate suitable analysis when needed","No; conflict context is irrelevant to CBD","Only after transition"],answer:1,why:"The lesson distinguishes understanding and facilitating analysis from personally conducting every specialist study."},
        {q:"Why must an adviser examine the host country's legal system?",options:["To copy home-country SOPs exactly","To assess legitimacy, legal powers and limits affecting change","Because law is separate from reform planning","To bypass counterpart consultation"],answer:1,why:"Legal traditions and statutory frameworks constrain proposed reforms."}
      ]
    },
    {
      title: "Understand existing responses",
      duration: "7–10 min",
      screens: [
        {
          title: "You are not starting from zero",
          kicker: "Response analysis",
          lead: "Multiple stakeholders may already work with the same institution, sometimes pursuing different goals.",
          points: [
            "Map ongoing UN, national, bilateral and civil-society engagements relevant to the counterpart.",
            "Identify where mandates, resources and activities complement or compete.",
            "Avoid treating other actors automatically as obstacles—or assuming they are allies."
          ],
          takeaway: "Know who is doing what, where and why.",
          visualTitle: "Map the response landscape",
          visual: ["Who is present?","What are they doing?","With whom?","To what end?"],
          sourcePage: "9–10"
        },
        {
          title: "Interests are not always visible",
          kicker: "Understand incentives",
          lead: "An actor's public position may differ from its actual interests or needs.",
          points: [
            "Power aspirations, organisational incentives and resource pressures can shape cooperation.",
            "Host-nation reluctance to engage with external actors may be based on credible concerns.",
            "Consider how proposed engagement may affect legitimacy, relationships and local ownership."
          ],
          takeaway: "Understand motivations before designing engagement.",
          visualTitle: "Ask beyond the formal title",
          visual: ["Position","Interest","Need","Possible impact"],
          sourcePage: "9"
        },
        {
          title: "Coordinate to avoid unintended harm",
          kicker: "From mapping to responsible engagement",
          lead: "Even well-intended activities can duplicate work, exhaust counterparts or undermine other reforms.",
          points: [
            "Seek collaboration with relevant actors within applicable authority and mandate boundaries.",
            "Coordinate timing, information needs and assistance where appropriate.",
            "Record coordination risks and potential opportunities for the later SWOT analysis."
          ],
          takeaway: "Good coordination is part of effective analysis, not an afterthought.",
          visualTitle: "Risks to prevent",
          visual: ["Duplication","Counterpart fatigue","Conflicting incentives","Wasted resources"],
          sourcePage: "9–10"
        }
      ],
      quiz: [
        {q:"What is the core assumption of response analysis?",options:["No one has begun reform before UNPOL arrives","Actors and initiatives may already be operating in the same field","Only UN entities matter","Every actor supports the same objective"],answer:1,why:"The lesson stresses that advisers rarely begin with a blank slate."},
        {q:"Why examine stakeholders' motivations?",options:["To replace evidence with intuition","To understand possible cooperation, tension and resistance","To classify everyone as an adversary","To avoid communication"],answer:1,why:"Motivations affect constructive engagement and the effects of CBD interventions."},
        {q:"Two donors offer overlapping training to the same unit. Which concern is most relevant?",options:["Coordination, duplication and counterpart fatigue","A missing future KPI only","The unit's geographic location alone","A need to skip response analysis"],answer:0,why:"The curriculum explicitly highlights duplication, fatigue and resource efficiency."},
        {q:"A national counterpart hesitates to participate in a new external programme. The adviser should:",options:["Assume incompetence","Explore concerns, interests and implications for engagement","Ignore counterpart views","Impose the activity immediately"],answer:1,why:"Understanding counterpart perceptions supports legitimate and sustainable cooperation."},
        {q:"An existing international initiative is automatically a strong partner.",options:["True","False; motives and alignment must be examined","True only if it has a larger budget","True if it predates the mission"],answer:1,why:"Actors may be collaborators or sources of tension depending on goals and conduct."},
        {q:"Findings from response analysis may feed which later analytical tool?",options:["SWOT","Only final certification","Only payroll records","None; they are discarded"],answer:0,why:"Opportunities and risks arising from other actors inform the wider SWOT analysis."}
      ]
    },
    {
      title: "Diagnose the counterpart",
      duration: "8–12 min",
      screens: [
        {
          title: "What actually happens inside the institution?",
          kicker: "CBD analysis",
          lead: "CBD analysis looks at the counterpart's real policing systems, practice, structure and constraints.",
          points: [
            "Consider the organisation, department or unit that will own the change.",
            "Examine performance as it occurs, rather than only what formal documents claim.",
            "Identify issues that warrant deeper inquiry and that can later inform SWOT and baseline formulation."
          ],
          takeaway: "Start with counterpart reality and local ownership.",
          visualTitle: "Levels to investigate",
          visual: ["Enabling environment","Organisation / department","Individual practitioner"],
          sourcePage: "11, 20"
        },
        {
          title: "Triangulate what you hear",
          kicker: "Evidence-gathering methods",
          lead: "One interview rarely establishes a complete operational picture.",
          points: [
            "Use suitable combinations of interviews, surveys, observation and examination of work products.",
            "Invite counterpart self-assessment to support local participation and ownership.",
            "Distinguish claims, direct observations and documents; examine discrepancies before concluding."
          ],
          takeaway: "The strength of an analysis depends on the quality and diversity of evidence.",
          visualTitle: "Evidence channels",
          visual: ["Interviews","Observation","Surveys","Work products","Self-assessment"],
          sourcePage: "11"
        },
        {
          title: "Map people, power and interest",
          kicker: "Stakeholder analysis",
          lead: "Stakeholders are those involved in, influencing or affected by proposed CBD activities.",
          points: [
            "Identify both formal decision-makers and actors with informal influence.",
            "Assess their level of interest, influence and potential impact.",
            "Choose engagement and communication approaches proportionate to their role and revisable over time."
          ],
          takeaway: "Influence and interest guide engagement, not simplistic labels of good and bad actors.",
          visualTitle: "Power / interest planning",
          visual: ["High power · high interest","High power · lower interest","Lower power · high interest","Lower power · lower interest"],
          sourcePage: "12–13"
        }
      ],
      quiz: [
        {q:"The primary focus of CBD analysis is:",options:["Only regional conflict history","How a specific counterpart presently performs and functions","Only the donor's budget","Final evaluation after handover"],answer:1,why:"CBD analysis identifies the counterpart's as-is organisational and policing reality."},
        {q:"Which combination offers stronger evidence than a single interview?",options:["Interviews, observation and relevant work products","One unsupported assertion","A predetermined course outline","Only external opinions"],answer:0,why:"Multiple evidence sources can corroborate or challenge the initial picture."},
        {q:"Why is local ownership critical?",options:["It eliminates accountability","It supports buy-in, political will and sustainable change","It removes the need for analysis","It transfers all UN responsibilities automatically"],answer:1,why:"The curriculum identifies local ownership as fundamental to lasting CBD."},
        {q:"A community representative has no formal position but strong informal influence. The adviser should:",options:["Exclude them automatically","Assess their actual influence and engagement relevance","Count only official job titles","Place them in SWOT before learning their interests"],answer:1,why:"Stakeholder influence may extend beyond formal authority."},
        {q:"Which characteristics matter in stakeholder analysis?",options:["Interest and influence","Uniform rank and salary only","Age and distance only","Number of training slides"],answer:0,why:"The lesson uses interest, influence and engagement implications to structure the analysis."},
        {q:"Stakeholder analysis should never be revisited once a project starts.",options:["True","False; actors and expectations may change","True if the power map has four quadrants","True only for UN agencies"],answer:1,why:"Stakeholder needs, positions and influence can evolve."}
      ]
    },
    {
      title: "Use the CBD matrix",
      duration: "8–12 min",
      screens: [
        {
          title: "Five areas of institutional capacity",
          kicker: "The areas axis",
          lead: "The lesson identifies five broad areas in which national police capacity should be assessed.",
          points: [
            "Police services: knowledge, skills, command and control.",
            "Enabling services: people, training, finance, logistics and support.",
            "Police policy formulation; accountability mechanisms; and stakeholder engagement."
          ],
          takeaway: "A weakness in investigation outcomes can originate well beyond an investigator's skills.",
          visualTitle: "Five CBD areas",
          visual: ["Police services","Enabling services","Police policy formulation","Accountability mechanisms","Stakeholder engagement"],
          sourcePage: "14–15"
        },
        {
          title: "Six dimensions cross every area",
          kicker: "The dimensions axis",
          lead: "The same institutional issue may have consequences across several cross-cutting requirements.",
          points: [
            "Policing practice, environmental sustainability and conflict prevention.",
            "Human rights, gender and comprehensive protection of civilians (CPOC).",
            "Human rights and protection considerations are substantive analytical obligations, not decoration."
          ],
          takeaway: "The five areas × six dimensions provide a disciplined classification framework.",
          visualTitle: "Six cross-cutting dimensions",
          visual: ["Policing practice","Environmental sustainability","Conflict prevention","Human rights","Gender","CPOC"],
          sourcePage: "16–17"
        },
        {
          title: "Move from observations to structured issues",
          kicker: "The 5 × 6 analytical matrix",
          lead: "The goal is to connect source-based institutional issues with the relevant area and dimension.",
          points: [
            "Read each evidence item and identify the underlying capacity or institutional issue.",
            "Choose the most relevant CBD area and specialised dimension; justify the link.",
            "Avoid automatically assigning everything to general policing practice when a more specific dimension applies."
          ],
          takeaway: "A useful matrix records defensible issues—not a list of unsupported assumptions.",
          visualTitle: "Classification logic",
          visual: ["Evidence item","CBD area","Relevant dimension","Issue to investigate"],
          sourcePage: "14–18, 20–21"
        }
      ],
      quiz: [
        {q:"How many broad CBD areas does Lesson 1 identify?",options:["Four","Five","Six","Seven"],answer:1,why:"The curriculum defines five areas of institutional CBD analysis."},
        {q:"Which is an enabling-service issue?",options:["Fleet procurement and logistics","A conflict actor's public position","An evaluation award ceremony","A purely external political event"],answer:0,why:"Enabling services include HR, budgeting, procurement and logistics."},
        {q:"Which is one of the six cross-cutting dimensions?",options:["Donor branding","Gender","Officer seniority","Delivery speed"],answer:1,why:"Gender is a mandated cross-cutting analytical dimension."},
        {q:"A complaint mechanism does not investigate alleged rights violations. Which CBD area is a strong starting point?",options:["Accountability mechanisms","Technology purchases only","International fundraising","Social media design"],answer:0,why:"Accountability includes oversight, internal investigations, codes and standards."},
        {q:"Which dimension addresses child protection and conflict-related sexual violence?",options:["Comprehensive protection of civilians","Procurement","Police policy formulation as a dimension","Officer housing"],answer:0,why:"CPOC includes relevant protection needs, including CRSV and children."},
        {q:"Which practice is most consistent with the intended matrix use?",options:["Record only paragraph numbers without issues","Classify evidence-backed issues by area and dimension","Treat every problem as policing practice","Skip specialised dimensions"],answer:1,why:"The exercise expects topic-based classification using the appropriate area and dimension."}
      ]
    },
    {
      title: "Synthesize and establish a baseline",
      duration: "8–12 min",
      screens: [
        {
          title: "From findings to SWOT",
          kicker: "Structured synthesis",
          lead: "Once the CBD analysis identifies issues, appraise them as strengths, weaknesses, opportunities or threats relevant to the proposed change.",
          points: [
            "Strengths and weaknesses examine factors internal to the relevant counterpart or system.",
            "Opportunities and threats examine consequential external conditions or influences.",
            "Ground each entry in earlier analysis; avoid invented or generic entries."
          ],
          takeaway: "SWOT must be evidence-led and should follow—rather than substitute for—analysis.",
          visualTitle: "SWOT lens",
          visual: ["Strengths · internal","Weaknesses · internal","Opportunities · external","Threats · external"],
          sourcePage: "10, 18, 20"
        },
        {
          title: "Record an evaluable as-is baseline",
          kicker: "Bridge to later CBD phases",
          lead: "The baseline fixes the current situation before interventions and targets are established.",
          points: [
            "Quantitative indicators can include verified counts, rates, proportions or elapsed time.",
            "Qualitative indicators can include documented practices, observed conditions and structured narratives.",
            "Record data sources, reporting periods, limitations and later verification methods wherever possible."
          ],
          takeaway: "An as-is baseline can later be compared with a defined to-be state.",
          visualTitle: "Baseline example · illustrative only",
          visual: ["Issue: inconsistent case tracking","As-is: no verified central register","Evidence: file review + interviews","Later measure: adoption and use"],
          sourcePage: "19"
        },
        {
          title: "You are ready for the CARANA workbench",
          kicker: "Apply the complete sequence",
          lead: "In the existing CARANA activity, investigate the fictional Galasi Criminal Investigations Services using the lesson's analytical tools.",
          points: [
            "Review the scenario and stakeholder context before proposing solutions.",
            "Build a structured picture using the areas–dimensions matrix, SWOT and an as-is baseline.",
            "Use the findings to identify credible entry points for the next CBD phase."
          ],
          takeaway: "Pass the final checkpoint to continue to the guided practice step.",
          visualTitle: "Carry your learning into practice",
          visual: ["Context","Actors","Institution","SWOT + baseline","Exercise"],
          sourcePage: "18–21; participant exercise (Annex A), blank tools (Annex E)"
        }
      ],
      quiz: [
        {q:"When should SWOT be performed within Lesson 1?",options:["Before any information gathering","After identifying issues through CBD analysis","Only after a final transition plan","Instead of stakeholder analysis"],answer:1,why:"The lesson places SWOT after analytical findings have been identified."},
        {q:"An existing competent records team is primarily a:",options:["Strength","Threat","External opportunity","Target indicator"],answer:0,why:"An existing internal capability is a strength."},
        {q:"A new external donor programme that may support reform is primarily a:",options:["Weakness","Opportunity","Internal strength","Baseline value"],answer:1,why:"Potential external support is normally classified as an opportunity, subject to verification."},
        {q:"Which example is a defensible qualitative baseline?",options:["Improve trust quickly","Case review shows inconsistent documentation, recorded with its source","Train 100 staff next month","Achieve excellent performance"],answer:1,why:"The baseline should describe an observed current condition with supporting evidence."},
        {q:"What is the key difference between a baseline and a target?",options:["There is no difference","Baseline is the present reference; target is the intended future state","Baseline is always numerical; target always narrative","Target must precede analysis"],answer:1,why:"The lesson distinguishes the as-is state from the desired to-be state."},
        {q:"What should the adviser take into the CARANA exercise?",options:["A fixed solution chosen beforehand","A sequence of analysis, evidence, stakeholder assessment, matrix, SWOT and baseline","Only a presentation script","Only a project budget"],answer:1,why:"The exercise applies the connected analytical approaches across the lesson."}
      ]
    }
  ]
};
