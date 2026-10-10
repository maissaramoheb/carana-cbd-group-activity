/**
 * UN Peacekeeping CBD Curriculum Glossary
 * Extracted directly from UN Peacekeeping Training Material:
 * Job-Specific Training on Capacity-Building and Development for United Nations Police (UNPOL 2021)
 * Lessons 0, 1, 2, and 3 Official Terminologies
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CURRICULUM_GLOSSARY = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TERMS = [
    {
      term: 'Activity',
      definition: 'Action taken to transform inputs into outputs.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Assumption',
      definition: 'Hypothesis about risks, influences, external factors, or conditions that could affect the progress or success of a programme/sub-programme. Assumptions highlight external factors, which are important for programme/sub-programme successes, but are largely or completely beyond the control of management.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Baseline',
      definition: 'Data that describes the [current] situation to be addressed by a programme, sub-programme, or project and that serve as the starting point for measuring performance the status quo based on the result of an analysis (as opposed to being based on assumption).',
      lesson: 'Lesson 0 & 1 & 3'
    },
    {
      term: 'Benchmark',
      definition: 'A reference point or standard against which performance or achievement can be assessed [or compared]. It often refers to an intermediate target to measure progress within a given period as well as to the performance of other comparable organizational entities.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Capacity',
      definition: 'Aptitudes, resources, relationships and facilitating conditions necessary to act effectively to achieve some intended purpose (performance, personnel, workload, supervisory, facility, support services, systems, structural, role). Capacity is what exists at present, whilst capability refers to that which could be demonstrated under the right conditions.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Capacity-Building & Development (CBD)',
      definition: 'The efforts to strengthen capacities – targets individuals, institutions, and their enabling environments. Fosters host-State LEAs capability to be democratic, law-abiding, human rights compliant and gender responsive.',
      lesson: 'Lesson 0 & 1'
    },
    {
      term: 'Contingency Plans / Planning',
      definition: 'Alternative plans and strategies to the original programme plan that can be implemented when required. Contingency planning is based upon the assumption that alternative action can be developed more effectively and efficiently if they are prepared before the risk or crisis materializes, rather than reactively and under stress.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Effectiveness',
      definition: 'The extent to which expected programme/sub-programme activities are achieved.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Efficiency',
      definition: 'Measure of how well inputs (funds, expertise, time, etc.) are converted to outputs.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'End-state',
      definition: 'The end-state of the UN Field Mission is the desired state of affairs in the country on completion of the Security Council mandate.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Evaluation',
      definition: 'A systematic and objective process seeking to determine the relevance, effectiveness, and impact of a programme/subprogramme related to its goals and objectives.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Impact',
      definition: 'The overall effect of accomplishing specific results and, in some situations, it comprises changes, whether planned or unplanned, positive, or negative, direct, or indirect, primary, and secondary that a programme/sub-programme helped to bring about.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Indicator (PI / KPI)',
      definition: 'Measure, preferably numeric, of a variable that provides a reasonably simple and reliable basis for assessing achievement, change or performance. A unit of information measured over time that can help show changes in a specific condition.',
      lesson: 'Lesson 0 & 2 & 3'
    },
    {
      term: 'Input',
      definition: 'Personnel and other resources necessary for producing outputs and achieving accomplishments (capital, labor, information/knowledge).',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Local Ownership',
      definition: 'Inclusive and consultative processes based on the perspectives, priorities, and vision of the local stakeholders in the host country; the general understanding that sustainable peace requires active engagement of local actors at all levels.',
      lesson: 'Lesson 0 & 1 & 2'
    },
    {
      term: 'Logframe (Logical Framework Matrix)',
      definition: 'Management tool used to identify elements of a programme or sub-programme (objective/goal, outcomes, outputs, activities, inputs) and their causal relationships, as well as the assumptions and external factors that may influence success and failure. It facilitates planning, implementation, monitoring and evaluation.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Monitoring, Mentoring and Advising (MMA)',
      definition: 'A complementary package of activities allowing CBD actors to support local reform. Monitoring gives a situational picture; advising gives situational guidance; mentoring fosters long-term personal professional growth.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Objective',
      definition: 'An overall desired achievement involving a process of change that is aimed at meeting certain needs of identified end-users within a given period of time.',
      lesson: 'Lesson 0 & 2'
    },
    {
      term: 'Outcome',
      definition: 'In the United Nations Secretariat, "outcome" is used as a synonym of an accomplishment or a result.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Output',
      definition: 'The final product or deliverables by a programme/sub-programme to stakeholders, which an activity is expected to produce in order to achieve its objectives (e.g. reports, SOPs, trained officers, specialized units).',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Results-Based Budgeting (RBB)',
      definition: 'A programme budget process in which programme formulation revolves around predefined objectives and expected results, resource requirements are derived from outputs required to achieve results, and actual performance is measured by objective performance indicators.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Risk',
      definition: 'The effect of uncertainty on objectives; the likelihood of a threat occurring.',
      lesson: 'Lesson 0 & 3'
    },
    {
      term: 'Security Sector Reform (SSR)',
      definition: 'Process of assessment, review, implementation, and M&E led by national authorities to enhance effective and accountable security for the State and its peoples without discrimination and with full respect for human rights and rule of law (UNSCR 2151).',
      lesson: 'Lesson 0 & 2'
    },
    {
      term: 'SMART',
      definition: 'Specific (mandate-related), Measurable (quantifiable elements), Achievable (can happen in specific period), Realistic/Relevant (falls within mandated tasks), Time-bound (achievable within necessary time frame).',
      lesson: 'Lesson 0 & 2'
    },
    {
      term: 'Stakeholder',
      definition: 'An agency, organization, group, or individual interested in or affected by a programme/subprogramme’s end results.',
      lesson: 'Lesson 0 & 1'
    },
    {
      term: 'Sustainability',
      definition: 'The extent to which the impact of the programme or project will last after its termination; the probability of continued long-term benefits.',
      lesson: 'Lesson 0 & 2'
    },
    {
      term: 'Theory of Change',
      definition: 'A comprehensive illustration and explanation of how and why a desired change is expected to happen in a particular context, mapping out the "missing middle" between activities and long-term impact ("If we do X, then Y will result because...").',
      lesson: 'Lesson 3'
    }
  ];

  return {
    TERMS,
    findTerm: function (name) {
      return TERMS.find(t => t.term.toLowerCase() === (name || '').toLowerCase());
    }
  };
});
