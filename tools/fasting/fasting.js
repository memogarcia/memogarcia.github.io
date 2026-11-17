// Fasting. One glass, one waterline, one lamp.
//
// The glass holds the whole fast: full when it starts, empty at the goal, so
// the waterline sits at the hour you are in. The lines etched on the front are
// the hours, and the dashed ones are where the body changes fuel.

((globalScope) => {
  const STORAGE_KEY = 'memo-tools-fasting-v1';
  const BASE_TITLE = (typeof document !== 'undefined' && document.title) ? document.title : 'Fasting · Memo Garcia';
  const HOUR_MS = 3_600_000;

  const PRESETS = {
    '12h': { id: '12h', label: '12:12', minutes: 12 * 60, note: '12:12. Eat inside a 12 hour window.' },
    '14h': { id: '14h', label: '14:10', minutes: 14 * 60, note: '14:10. Eat inside a 10 hour window.' },
    '16h': { id: '16h', label: '16:8', minutes: 16 * 60, note: '16:8. Eat inside an 8 hour window.' },
    '18h': { id: '18h', label: '18:6', minutes: 18 * 60, note: '18:6. Eat inside a 6 hour window.' },
    '20h': { id: '20h', label: '20:4', minutes: 20 * 60, note: '20:4. Eat inside a 4 hour window.' },
    '24h': { id: '24h', label: 'OMAD', minutes: 24 * 60, note: 'OMAD. One meal a day, dinner to dinner.' },
    '36h': { id: '36h', label: '36h', minutes: 36 * 60, note: 'Dinner, a whole day without food, then breakfast.' },
    '48h': { id: '48h', label: '48h', minutes: 48 * 60, note: 'Two days. Water and electrolytes matter from here.' },
    '72h': { id: '72h', label: '72h', minutes: 72 * 60, note: 'Three days. Check with a clinician before you start.' },
  };

  // Where the body changes fuel. Each one is a dashed line on the glass.
  const PHASES = [
    { id: 'digestion', from: 0, name: 'digestion' },
    { id: 'glycogen', from: 4, name: 'glycogen' },
    { id: 'ketosis', from: 12, name: 'ketosis' },
    { id: 'autophagy', from: 24, name: 'autophagy' },
    { id: 'extended', from: 48, name: 'deep fast' },
  ];

  const MILESTONE_HOURS = [4, 12, 16, 18, 24, 36, 48, 72];

  const HOUR_BENEFITS = [
    { hour: 0, phase: 'digestion', phaseLabel: 'Digestion', title: 'Meal digestion begins', fuel: 'Dietary carbs & fat', insulin: 'Rising', shift: 'Nutrient uptake', benefit: 'Food enters the stomach and upper intestine. Blood glucose begins rising as carbohydrates start breaking down.' },
    { hour: 1, phase: 'digestion', phaseLabel: 'Digestion', title: 'Glucose absorption peaks', fuel: 'Dietary glucose', insulin: 'Peaking', shift: 'Energy storage', benefit: 'Pancreatic insulin rises to move absorbed glucose into muscle, liver, and fat cells while suppressing fat release.' },
    { hour: 2, phase: 'digestion', phaseLabel: 'Digestion', title: 'Glycogen storage and protein uptake', fuel: 'Dietary glucose', insulin: 'High, tapering', shift: 'Glycogen synthesis', benefit: 'Muscle and liver top off glycogen reserves and absorb amino acids from your last meal.' },
    { hour: 3, phase: 'digestion', phaseLabel: 'Digestion', title: 'Gastric emptying slows down', fuel: 'Late dietary nutrients', insulin: 'Descending', shift: 'Post-meal taper', benefit: 'Most simple carbohydrates have cleared the stomach, and insulin begins stepping down from its post-meal peak.' },

    { hour: 4, phase: 'glycogen', phaseLabel: 'Glycogen Drawdown', title: 'Post-absorptive transition', fuel: 'Blood glucose + liver glycogen', insulin: 'Falling', shift: 'Glucagon rises', benefit: 'Gut nutrient delivery fades and the liver starts releasing stored glycogen to keep blood sugar steady.' },
    { hour: 5, phase: 'glycogen', phaseLabel: 'Glycogen Drawdown', title: 'Insulin settles toward baseline', fuel: 'Liver glycogen', insulin: 'Trending low', shift: 'Storage switch closes', benefit: 'Lower insulin eases the brake on stored triglycerides, allowing early fat mobilization to warm up.' },
    { hour: 6, phase: 'glycogen', phaseLabel: 'Glycogen Drawdown', title: 'Gut motility sweeps clean', fuel: 'Liver glycogen', insulin: 'Low', shift: 'Migrating motor complex', benefit: 'Housekeeping waves sweep residual food and bacteria down the small intestine, giving the upper gut a quiet break.' },
    { hour: 7, phase: 'glycogen', phaseLabel: 'Glycogen Drawdown', title: 'Digestive workload drops', fuel: 'Liver glycogen + fatty acids', insulin: 'Low', shift: 'Resting gut', benefit: 'Less blood flow and metabolic effort go toward digestion, which often reduces post-meal sluggishness.' },
    { hour: 8, phase: 'glycogen', phaseLabel: 'Glycogen Drawdown', title: 'Lipolysis begins contributing', fuel: 'Glycogen + free fatty acids', insulin: 'Low', shift: 'Fat release starts', benefit: 'Adipose tissue releases more free fatty acids into circulation so skeletal muscle can spare remaining glucose.' },
    { hour: 9, phase: 'glycogen', phaseLabel: 'Glycogen Drawdown', title: 'Peripheral tissues shift to fat', fuel: 'Glycogen + fatty acids', insulin: 'Low', shift: 'Glucose sparing', benefit: 'Resting muscles lean more on fatty acids for fuel, preserving liver glycogen for the brain and red blood cells.' },
    { hour: 10, phase: 'glycogen', phaseLabel: 'Glycogen Drawdown', title: 'Gluconeogenesis supports glucose', fuel: 'Glycogen + glycerol/amino acids', insulin: 'Low baseline', shift: 'Endogenous glucose', benefit: 'As liver glycogen thins out, the liver steps up gluconeogenesis to keep blood glucose stable without food.' },
    { hour: 11, phase: 'glycogen', phaseLabel: 'Glycogen Drawdown', title: 'Fat mobilization accelerates', fuel: 'Fatty acids + waning glycogen', insulin: 'Low baseline', shift: 'Pre-ketosis ramp', benefit: 'Insulin rests near fasting baseline while fatty acid oxidation climbs toward the metabolic switch point.' },

    { hour: 12, phase: 'ketosis', phaseLabel: 'Fat & Ketone Shift', title: 'Metabolic switch threshold', fuel: 'Free fatty acids + early ketones', insulin: 'Fasting baseline', shift: 'Glycogen low', benefit: 'For many adults, liver glycogen reaches low levels here and fat breakdown becomes the primary source of resting fuel.' },
    { hour: 13, phase: 'ketosis', phaseLabel: 'Fat & Ketone Shift', title: 'Early ketone production starts', fuel: 'Fatty acids + BHB', insulin: 'Fasting baseline', shift: 'Hepatic ketogenesis', benefit: 'The liver converts surplus acetyl-CoA from fat oxidation into beta-hydroxybutyrate (BHB) for brain and heart fuel.' },
    { hour: 14, phase: 'ketosis', phaseLabel: 'Fat & Ketone Shift', title: 'Fat oxidation climbs, hunger pulses pass', fuel: 'Fatty acids + rising ketones', insulin: 'Very low', shift: 'Ghrelin wave', benefit: 'Fat burning deepens. Hunger waves triggered by habit often peak for 15 to 20 minutes and fade when hydrated.' },
    { hour: 15, phase: 'ketosis', phaseLabel: 'Fat & Ketone Shift', title: 'Measurable ketone lift for most fasts', fuel: 'Fat + ketones', insulin: 'Very low', shift: 'Cleaner fuel mix', benefit: 'Blood ketones rise above fed baseline, providing steady backup energy with fewer blood sugar swings.' },
    { hour: 16, phase: 'ketosis', phaseLabel: 'Fat & Ketone Shift', title: '16:8 daily intermittent threshold', fuel: 'Predominantly fat + ketones', insulin: 'Very low', shift: 'Steady lipolysis', benefit: 'Classic 16:8 target. Low insulin and steady fat oxidation support metabolic flexibility and calm focus.' },
    { hour: 17, phase: 'ketosis', phaseLabel: 'Fat & Ketone Shift', title: 'Mild norepinephrine preserves alertness', fuel: 'Fat + ketones', insulin: 'Very low', shift: 'Alertness preserved', benefit: 'Gentle sympathetic tone helps maintain resting energy expenditure and mental sharpness despite no food intake.' },
    { hour: 18, phase: 'ketosis', phaseLabel: 'Fat & Ketone Shift', title: 'Cellular cleanup signals rise', fuel: 'Fat + ketones', insulin: 'Very low', shift: 'AMPK rises, mTOR drops', benefit: 'Low energy availability activates AMPK and quiets mTOR, priming early cellular recycling alongside deeper fat burn.' },
    { hour: 19, phase: 'ketosis', phaseLabel: 'Fat & Ketone Shift', title: 'Growth hormone pulses preserve lean mass', fuel: 'Fat + ketones', insulin: 'Very low', shift: 'HGH pulsatility', benefit: 'Higher growth hormone pulse amplitude supports fat mobilization while helping protect skeletal muscle protein.' },
    { hour: 20, phase: 'ketosis', phaseLabel: 'Fat & Ketone Shift', title: '20:4 milestone: deep fat reliance', fuel: 'Fatty acids + ketones', insulin: 'Very low', shift: 'Liver glycogen minimal', benefit: 'Liver glycogen is largely spent, so mobilized body fat and ketones cover almost all resting caloric demand.' },
    { hour: 21, phase: 'ketosis', phaseLabel: 'Fat & Ketone Shift', title: 'Brain draws a larger share from ketones', fuel: 'Fatty acids + ketones', insulin: 'Very low', shift: 'Neural ketone use', benefit: 'Higher BHB availability reduces the brain\'s glucose requirement, easing pressure on amino acid breakdown.' },
    { hour: 22, phase: 'ketosis', phaseLabel: 'Fat & Ketone Shift', title: 'Inflammatory signaling dips', fuel: 'Fatty acids + ketones', insulin: 'Very low', shift: 'Lower post-meal stress', benefit: 'With zero postprandial glucose spikes for nearly a day, circulating inflammatory cytokines tend to settle.' },
    { hour: 23, phase: 'ketosis', phaseLabel: 'Fat & Ketone Shift', title: 'Approaching the 24-hour mark', fuel: 'Fatty acids + ketones', insulin: 'Very low', shift: 'Repair transition', benefit: 'Ketogenesis and cellular housekeeping build momentum as the digestive tract enjoys nearly a full day of rest.' },

    { hour: 24, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: '24-hour (OMAD) milestone', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Autophagy active', benefit: 'Cellular recycling (autophagy) ramps up to break down worn organelles and misfolded proteins while ketones climb.' },
    { hour: 25, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Extended gut rest and mucosal turnover', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Intestinal rest', benefit: 'A full day without digestive load reduces gut barrier friction and supports epithelial recovery.' },
    { hour: 26, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'BHB acts as a signaling molecule', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Oxidative defense', benefit: 'Beyond fuel, beta-hydroxybutyrate signals antioxidant and stress-resistance gene pathways.' },
    { hour: 27, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Elevated growth hormone supports lean tissue', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Protein sparing', benefit: 'Sustained growth hormone release shifts substrate preference away from protein breakdown toward adipose stores.' },
    { hour: 28, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Intracellular lipid clearance deepens', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Insulin sensitivity', benefit: 'Liver and muscle cells clear stored ectopic fat droplets, supporting stronger insulin sensitivity when you next eat.' },
    { hour: 29, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Day-one hunger often softens', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Appetite steadies', benefit: 'Steady ketones and flatter blood glucose frequently blunt acute hunger signals compared with hours 12 to 20.' },
    { hour: 30, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Mitochondrial quality control', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Mitophagy active', benefit: 'Damaged mitochondria are tagged and recycled (mitophagy), favoring more efficient energy-producing networks.' },
    { hour: 31, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Watch water and sodium balance', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Natriuresis check', benefit: 'Low insulin increases kidney sodium excretion; plain water plus electrolytes helps prevent fatigue or headaches.' },
    { hour: 32, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Overwhelmingly fat-derived expenditure', fuel: 'Fatty acids + ketones', insulin: 'Minimal', shift: 'Deep fat oxidation', benefit: 'Lipolysis and ketogenesis supply the vast majority of resting energy needs while blood sugar stays tight.' },
    { hour: 33, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'BDNF neuro-support pathways active', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'BDNF signaling', benefit: 'Ketones and mild metabolic stress promote brain-derived neurotrophic factor (BDNF), tied to synaptic resilience.' },
    { hour: 34, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Overnight deep metabolic adaptation', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Calm autonomic tone', benefit: 'Maintaining sleep and hydration through day two keeps cortisol steadier and supports cellular maintenance.' },
    { hour: 35, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Nutritional ketosis deepens', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Higher BHB range', benefit: 'Many adults cross higher ketone concentrations here (often around 1.0 mmol/L or above, varying by diet and activity).' },
    { hour: 36, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: '36-hour milestone: sustained cellular renewal', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Full-day fast complete', benefit: 'Continuous low insulin and strong AMPK signaling keep autophagy and fat oxidation running smoothly.' },
    { hour: 37, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Protein conservation tightens', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Nitrogen sparing', benefit: 'As brain tissues adapt further to ketone bodies, daily protein catabolism drops below day-one rates.' },
    { hour: 38, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Adipose release stays steady', fuel: 'Fatty acids + ketones', insulin: 'Minimal', shift: 'Flat glycemic curve', benefit: 'Blood glucose remains remarkably flat without post-meal swings while fat stores fuel daily activity.' },
    { hour: 39, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Antioxidant defenses stay upregulated', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Cellular resilience', benefit: 'Stress-response proteins help protect cells against reactive oxygen species during fat-heavy metabolism.' },
    { hour: 40, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Hepatic fat burden eases', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Liver clearance', benefit: 'Extended fasting gives the liver space to clear stored triglycerides and restore tighter metabolic signaling.' },
    { hour: 41, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Tissue-wide cleanup continues', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Lysosomal turnover', benefit: 'Autophagy across liver, muscle, and neural tissues continues clearing aging protein aggregates.' },
    { hour: 42, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Mental clarity when electrolytes hold', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Ketone-fueled focus', benefit: 'Many report calm mental steadiness at this stage, provided sodium, potassium, and fluids are kept balanced.' },
    { hour: 43, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Glycerol sustains essential glucose', fuel: 'Ketones + fat + glycerol', insulin: 'Minimal', shift: 'Minimal muscle draw', benefit: 'Fat breakdown supplies glycerol backbones to cover essential glucose without leaning heavily on muscle tissue.' },
    { hour: 44, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Digestive enzyme demand stays quiet', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Deep GI rest', benefit: 'Digestive secretions remain minimal, letting the gut lining stay calm prior to eventual refeeding.' },
    { hour: 45, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Growth hormone pulses stay elevated', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Tissue defense', benefit: 'Counter-regulatory hormones help preserve lean structure as you approach two full days.' },
    { hour: 46, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Leukocyte energy conservation shifts', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Immune signaling', benefit: 'Lower IGF-1 and PKA signaling begin nudging white blood cell turnover toward conservation and renewal.' },
    { hour: 47, phase: 'autophagy', phaseLabel: 'Autophagy & Repair', title: 'Approaching the 48-hour threshold', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Electrolyte check', benefit: 'Check hydration, sodium, and how you feel physically before continuing into a third fasting day.' },

    { hour: 48, phase: 'extended', phaseLabel: 'Extended Fast', title: '48-hour milestone: low IGF-1 and deep repair', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'IGF-1 reduced', benefit: 'Two days in, baseline insulin and IGF-1 drop substantially, keeping cellular maintenance prioritized over growth.' },
    { hour: 49, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Repair mode holds over anabolic growth', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Low mTOR/IGF-1', benefit: 'Low IGF-1 signaling reduces proliferative pressure and favors cellular stress-resistance programs.' },
    { hour: 50, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Brain ketone share rises further', fuel: 'High ketones + fatty acids', insulin: 'Minimal', shift: 'Deep keto-adaptation', benefit: 'Neural tissues cover a large majority of energy demand with ketones, conserving remaining protein reserves.' },
    { hour: 51, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Inflammatory tone remains quiet', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Low oxidative load', benefit: 'Absence of dietary inflammatory triggers and steady BHB signaling help keep baseline inflammation low.' },
    { hour: 52, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Keep exertion gentle', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Gentle movement', benefit: 'Light walking and mobility feel good here, while high-intensity training is better saved until after refeeding.' },
    { hour: 53, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Prolonged immune signaling adjustments', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'White cell turnover', benefit: 'Extended nutrient scarcity continues signaling older immune cells to clear out in readiness for renewal.' },
    { hour: 54, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Listen closely to physical cues', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Safety check-in', benefit: 'At 54 hours, persistent dizziness, palpitations, or weakness are clear signals to stop and refeed slowly.' },
    { hour: 55, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Steady hepatic ketogenesis', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Liver fat export', benefit: 'The liver cleanly converts mobilized adipose fatty acids into circulating ketones at a stable multi-day pace.' },
    { hour: 56, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Ketones settle toward multi-day plateau', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Ketone plateau', benefit: 'In clinical fasting studies, blood ketones often climb toward 2 to 4 mmol/L around day two to three.' },
    { hour: 57, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Sustained intracellular recycling', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Deep autophagy', benefit: 'Lysosomal turnover continues clearing damaged cellular debris while nutrient-sensing pathways stay quiet.' },
    { hour: 58, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Intestinal stem cell readiness', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Gut priming', benefit: 'Animal and organoid fasting research points to heightened intestinal stem cell readiness for post-fast renewal.' },
    { hour: 59, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Stand up slowly and stay hydrated', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Blood pressure care', benefit: 'Lower blood volume from water and sodium loss makes slow posture changes and electrolytes important.' },
    { hour: 60, phase: 'extended', phaseLabel: 'Extended Fast', title: '60-hour mark: fat-adapted fasting state', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Full lipid reliance', benefit: 'Two and a half days without calories leaves exogenous glucose long gone and lipid metabolism fully dominant.' },
    { hour: 61, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Cellular defense programs remain active', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Stress-resistance', benefit: 'Continued low insulin and IGF-1 keep maintenance and antioxidant genes active without dietary interruption.' },
    { hour: 62, phase: 'extended', phaseLabel: 'Extended Fast', title: 'High protein conservation efficiency', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Muscle sparing', benefit: 'Endogenous glucose demand stays low enough that lean tissue breakdown remains tightly conserved.' },
    { hour: 63, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Steady neural ketone oxidation', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Cognitive steadiness', benefit: 'Efficient brain uptake of acetoacetate and BHB supports alertness late into day three.' },
    { hour: 64, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Prolonged oxidative and inflammatory calm', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Systemic quiet', benefit: 'Systemic inflammatory markers often bottom out relative to baseline when hydration and sleep remain solid.' },
    { hour: 65, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Plan a gentle refeeding meal', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Refeed planning', benefit: 'Prepare light broth, cooked vegetables, or small protein portions rather than a large sugar- or fat-heavy meal.' },
    { hour: 66, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Digestive enzymes sit downregulated', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Protect gut comfort', benefit: 'Because stomach acid and digestive enzymes have scaled down, breaking the fast slowly prevents cramping.' },
    { hour: 67, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Final stretch of a 3-day fast', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Warmth & rest', benefit: 'Mild chilliness is common as energy conserves; dress warmly and avoid strenuous output.' },
    { hour: 68, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Deep lipid mobilization continues', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Sustained ketosis', benefit: 'Fatty acid release and ketone synthesis stay steady while insulin sits near its physiological floor.' },
    { hour: 69, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Immune renewal signaling deepens', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Hematopoietic cue', benefit: 'Prolonged low PKA and IGF-1 signaling primes hematopoietic stem cell renewal upon careful refeeding.' },
    { hour: 70, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Two hours from the 72-hour mark', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Transition readiness', benefit: 'Have broth or a gentle first bite ready so ending the fast stays unhurried and controlled.' },
    { hour: 71, phase: 'extended', phaseLabel: 'Extended Fast', title: 'Final hour toward 72 hours', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Peak multi-day state', benefit: 'Cellular recycling, ketone fuel use, and immune reset signaling sit at multi-day depth.' },
    { hour: 72, phase: 'extended', phaseLabel: 'Extended Fast', title: '72-hour milestone: prolonged fast complete', fuel: 'Ketones + fatty acids', insulin: 'Minimal', shift: 'Stem cell & autophagy cue', benefit: 'Deep ketosis, sustained autophagy, and immune renewal signaling. Refeed slowly and consult a doctor before going past 72 hours.' },
  ];

  function getHourBenefit(hour) {
    const safeHour = Math.max(0, Math.floor(Number(hour) || 0));
    if (safeHour < HOUR_BENEFITS.length) {
      return HOUR_BENEFITS[safeHour];
    }
    return {
      hour: safeHour,
      phase: 'extended',
      phaseLabel: 'Extended Fast',
      title: `Hour ${safeHour}: multi-day extended fasting`,
      fuel: 'Ketones + fatty acids',
      insulin: 'Minimal',
      shift: 'Medical supervision advised',
      benefit: 'Deep ketosis and cellular maintenance continue past 72 hours. Prioritize electrolytes, break the fast gradually, and fast beyond 3 days only with medical guidance.',
    };
  }

  function phaseAt(hour) {
    let found = PHASES[0];
    for (const p of PHASES) if (hour >= p.from) found = p;
    return found;
  }

  function clampTotalGoalMinutes(totalMinutes) {
    const n = Math.round(Number(totalMinutes));
    if (!Number.isFinite(n)) return 16 * 60;
    return Math.max(60, Math.min(168 * 60, n));
  }

  function clampGoalMinutes(hours, minutes = 0) {
    const h = Math.max(0, Math.min(168, Math.floor(Number(hours) || 0)));
    const m = Math.max(0, Math.min(59, Math.floor(Number(minutes) || 0)));
    return clampTotalGoalMinutes(h * 60 + m);
  }

  function formatGoalLabel(goalMinutes) {
    const h = Math.floor(goalMinutes / 60);
    const m = goalMinutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  function formatHMS(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function formatDurationShort(ms) {
    const totalMin = Math.max(0, Math.round(ms / 60_000));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  function computeFastProgress(startTimeMs, goalMinutes, nowMs = Date.now()) {
    const goalMs = Math.max(60 * 60_000, goalMinutes * 60_000);
    const elapsedMs = Math.max(0, nowMs - startTimeMs);
    const remainingMs = goalMs - elapsedMs;
    const pct = (elapsedMs / goalMs) * 100;
    const currentHour = Math.floor(elapsedMs / HOUR_MS);
    const minutesIntoHour = Math.floor((elapsedMs % HOUR_MS) / 60_000);
    return {
      elapsedMs,
      goalMs,
      remainingMs,
      pastGoalMs: remainingMs < 0 ? Math.abs(remainingMs) : 0,
      goalReached: elapsedMs >= goalMs,
      pct,
      ringProgress: Math.min(1, elapsedMs / goalMs),
      currentHour,
      minutesIntoHour,
    };
  }

  // How much water is left: 1 is a full glass, 0 is the goal.
  function waterLevel(elapsedMs, goalMs) {
    if (!(goalMs > 0)) return 0;
    return Math.max(0, Math.min(1, 1 - elapsedMs / goalMs));
  }

  function computeFastingStats(history) {
    if (!Array.isArray(history) || history.length === 0) {
      return { count: 0, longestMs: 0, avgMs: 0, goalsMet: 0 };
    }
    let longestMs = 0;
    let totalMs = 0;
    let goalsMet = 0;
    for (const item of history) {
      const dur = Math.max(0, Number(item.elapsedMs) || 0);
      totalMs += dur;
      if (dur > longestMs) longestMs = dur;
      if (item.goalReached) goalsMet += 1;
    }
    return {
      count: history.length,
      longestMs,
      avgMs: Math.round(totalMs / history.length),
      goalsMet,
    };
  }

  // ── Glass geometry, in the SVG's own units ───────────────
  // A tumbler, a little wider at the lip, seen from slightly above. The eye is
  // above the glass, so circles lower down open up a little more.

  const G = {
    cx: 100,
    rim: 14,
    bottom: 426,
    full: 46,
    floor: 392,
    wall: 3.6,
    horizon: 426 - 0.24 * 440,
  };

  function outerHalf(y) {
    return 96 - 12 * (y - G.rim) / (G.bottom - G.rim);
  }

  function innerHalf(y) {
    return outerHalf(y) - G.wall;
  }

  function tilt(y) {
    return 0.105 + 0.05 * (y - G.rim) / (G.bottom - G.rim);
  }

  // Hour 0 is the full mark, the goal is the floor.
  function hourToY(hour, goalHours) {
    const f = Math.max(0, Math.min(1, hour / goalHours));
    return G.full + f * (G.floor - G.full);
  }

  function levelToY(level) {
    return G.floor - Math.max(0, Math.min(1, level)) * (G.floor - G.full);
  }

  // Which hours get a tick and which get a number, so a 12 hour glass and a
  // three day glass both read at a glance.
  function markPlan(goalHours) {
    const tick = goalHours <= 24 ? 1 : goalHours <= 48 ? 2 : goalHours <= 80 ? 3 : goalHours <= 120 ? 4 : 6;
    const label = [2, 4, 6, 8, 12, 24].find((s) => s % tick === 0 && goalHours / s <= 8) || 24;
    return { tick, label };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      PRESETS,
      PHASES,
      HOUR_BENEFITS,
      MILESTONE_HOURS,
      getHourBenefit,
      phaseAt,
      clampTotalGoalMinutes,
      clampGoalMinutes,
      formatGoalLabel,
      formatHMS,
      formatDurationShort,
      computeFastProgress,
      computeFastingStats,
      waterLevel,
      hourToY,
      markPlan,
    };
  }

  if (typeof document === 'undefined') return;

  // ── Sound ───────────────────────────────────────────────
  // Everything is synthesized. A glass rings higher the emptier it is, so the
  // same tap sounds different at hour 2 and at the goal.

  class Sound {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.on = true;
      this.buffers = new Map();
    }

    ensure() {
      if (this.ctx) {
        if (this.ctx.state !== 'running') {
          try {
            const p = this.ctx.resume();
            if (p && p.catch) p.catch(() => {});
          } catch { /* Stays suspended until the next gesture. */ }
        }
        return this.ctx;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        const ctx = new AudioCtx();
        const master = ctx.createGain();
        master.gain.value = this.on ? 0.8 : 0;
        if (ctx.createDynamicsCompressor) {
          const comp = ctx.createDynamicsCompressor();
          comp.threshold.value = -16;
          comp.knee.value = 16;
          comp.ratio.value = 3;
          master.connect(comp);
          comp.connect(ctx.destination);
        } else {
          master.connect(ctx.destination);
        }
        this.ctx = ctx;
        this.master = master;
      } catch {
        return null;
      }
      return this.ctx;
    }

    setOn(on) {
      this.on = Boolean(on);
      if (this.master) this.master.gain.value = this.on ? 0.8 : 0;
    }

    noise(seconds) {
      const ctx = this.ctx;
      const key = seconds;
      if (this.buffers.has(key)) return this.buffers.get(key);
      const length = Math.floor(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(1, length, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        ch[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
      }
      this.buffers.set(key, buf);
      return buf;
    }

    // A fingernail on the glass. `level` is the water in it, 0 to 1.
    clink(level, delaySec = 0, count = 1, soft = false) {
      if (!this.on) return;
      const ctx = this.ensure();
      if (!ctx || ctx.state !== 'running') return;
      try {
        const f = 1480 * (1 - 0.34 * Math.pow(Math.max(0, Math.min(1, level)), 1.4));
        const partials = [[1, 1, 2.4], [1.0035, 0.45, 2.1], [2.74, 0.24, 0.9], [5.2, 0.08, 0.35]];
        for (let n = 0; n < count; n++) {
          const t = ctx.currentTime + 0.02 + delaySec + n * 0.38;
          const vel = (soft ? 0.45 : 1) * (n === 0 ? 1 : 0.8);
          for (const [ratio, amp, decay] of partials) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = f * ratio;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.12 * amp * vel, t + 0.003);
            gain.gain.setTargetAtTime(0, t + 0.003, decay / 6.9);
            osc.connect(gain);
            gain.connect(this.master);
            osc.start(t);
            osc.stop(t + decay * 1.2 + 0.1);
          }
          const tap = ctx.createBufferSource();
          tap.buffer = this.noise(1);
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 4200;
          bp.Q.value = 1.4;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.06 * vel, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
          tap.connect(bp);
          bp.connect(g);
          g.connect(this.master);
          tap.start(t, Math.random() * 0.5);
          tap.stop(t + 0.04);
        }
      } catch { /* No sound is fine. */ }
    }

    // Water into a glass. The air above the water gets shorter as it fills,
    // so its note climbs. From and to are levels, 0 to 1.
    pour(seconds, from, to) {
      if (!this.on) return;
      const ctx = this.ensure();
      if (!ctx) return;
      try {
        const t = ctx.currentTime + 0.02;
        const end = t + seconds;
        const note = (lvl) => 380 / Math.max(0.12, 1.05 - lvl * 0.92);

        const src = ctx.createBufferSource();
        src.buffer = this.noise(2);
        src.loop = true;
        const body = ctx.createBiquadFilter();
        body.type = 'bandpass';
        body.Q.value = 7;
        body.frequency.setValueAtTime(note(from), t);
        body.frequency.linearRampToValueAtTime(note(to), end);
        const air = ctx.createBiquadFilter();
        air.type = 'highpass';
        air.frequency.value = 900;
        const gBody = ctx.createGain();
        const gAir = ctx.createGain();
        gBody.gain.setValueAtTime(0, t);
        gBody.gain.linearRampToValueAtTime(0.9, t + 0.08);
        gBody.gain.setValueAtTime(0.9, end - 0.2);
        gBody.gain.linearRampToValueAtTime(0, end + 0.05);
        gAir.gain.setValueAtTime(0, t);
        gAir.gain.linearRampToValueAtTime(0.06, t + 0.05);
        gAir.gain.linearRampToValueAtTime(0.025, end - 0.2);
        gAir.gain.linearRampToValueAtTime(0, end + 0.1);
        src.connect(body);
        body.connect(gBody);
        gBody.connect(this.master);
        src.connect(air);
        air.connect(gAir);
        gAir.connect(this.master);
        src.start(t);
        src.stop(end + 0.2);

        // Bubbles: short bright blips that rise with the note.
        const count = Math.round(seconds * 9);
        for (let i = 0; i < count; i++) {
          const at = t + 0.1 + Math.random() * (seconds - 0.15);
          const lvl = from + (to - from) * ((at - t) / seconds);
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const f0 = note(lvl) * (1.4 + Math.random() * 1.2);
          osc.frequency.setValueAtTime(f0, at);
          osc.frequency.exponentialRampToValueAtTime(f0 * 1.5, at + 0.03);
          g.gain.setValueAtTime(0, at);
          g.gain.linearRampToValueAtTime(0.025 + Math.random() * 0.03, at + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
          osc.connect(g);
          g.connect(this.master);
          osc.start(at);
          osc.stop(at + 0.05);
        }
      } catch { /* No sound is fine. */ }
    }
  }

  // ── Page ────────────────────────────────────────────────

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const body = document.body;
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const all = (cls) => Array.from(new Set(document.querySelectorAll(`.${cls}`)));

  const els = {
    stage: $('stage'),
    glass: $('glass'),
    phase: $('phase'),
    time: $('time'),
    status: $('status'),
    nowTag: $('now-tag'),
    card: $('card'),
    cardPrev: $('card-prev'),
    cardNext: $('card-next'),
    cardHour: $('card-hour'),
    cardWhen: $('card-when'),
    cardPhase: $('card-phase'),
    cardTitle: $('card-title'),
    cardText: $('card-text'),
    cardMeta: $('card-meta'),
    cardNow: $('card-now'),
    toggleBtn: $('toggle-btn'),
    discardBtn: $('discard-btn'),
    goalBtn: $('goal-btn'),
    startBtn: $('start-btn'),
    soundBtn: $('sound-btn'),
    logBtn: $('log-btn'),
    goalNote: $('goal-note'),
    customRow: $('custom-row'),
    customHours: $('custom-hours'),
    customMinutes: $('custom-minutes'),
    customApply: $('custom-apply'),
    notify: $('notify'),
    startInput: $('start-input'),
    earlier1: $('earlier-1h'),
    earlier2: $('earlier-2h'),
    startNow: $('start-now'),
    stats: $('stats'),
    noteInput: $('note-input'),
    logEmpty: $('log-empty'),
    logList: $('log-list'),
    logActions: $('log-actions'),
    logCopy: $('log-copy'),
    logClear: $('log-clear'),
    live: $('live'),
    favicon: $('favicon'),
    panels: { goal: $('panel-goal'), start: $('panel-start'), log: $('panel-log') },
  };
  const goalButtons = all('pick-goal');

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveStore(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* Continue in memory when storage is blocked. */ }
  }

  const saved = loadStore();
  let history = Array.isArray(saved?.history) ? saved.history : [];
  const presetId = saved?.presetId && (saved.presetId === 'custom' || PRESETS[saved.presetId]) ? saved.presetId : '16h';
  const savedGoal = Number.isFinite(Number(saved?.goalMinutes)) ? clampTotalGoalMinutes(saved.goalMinutes) : PRESETS['16h'].minutes;

  const state = {
    isFasting: Boolean(saved?.isFasting && typeof saved?.startTime === 'number'),
    startTime: typeof saved?.startTime === 'number' ? saved.startTime : null,
    plannedStartTime: typeof saved?.plannedStartTime === 'number' ? saved.plannedStartTime : null,
    presetId,
    goalMinutes: presetId === 'custom' ? savedGoal : PRESETS[presetId].minutes,
    customMinutes: Number.isFinite(Number(saved?.customMinutes)) ? clampTotalGoalMinutes(saved.customMinutes) : 17 * 60,
    displayMode: saved?.displayMode === 'remaining' ? 'remaining' : 'elapsed',
    note: typeof saved?.note === 'string' ? saved.note : '',
    sound: saved?.chimeOn !== false,
    notifyOn: Boolean(saved?.notifyOn),
    goalNotified: Boolean(saved?.goalNotified),
    // null follows the hour you are in
    pinnedHour: saved?.pinned === true && Number.isInteger(saved?.inspectedHour) ? Math.max(0, Math.min(168, saved.inspectedHour)) : null,
    previewHour: null,
    customOpen: false,
  };
  if (!state.isFasting) state.startTime = null;

  const sound = new Sound();
  sound.setOn(state.sound);

  let openPanel = null;
  let quietTimer = 0;
  let anim = null;
  let lastHour = -1;
  let lastPhase = null;
  let lastFavicon = '';
  let marked = { now: null, goal: null };
  let renderedGoal = null;
  const reduceMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function persist() {
    saveStore({
      isFasting: state.isFasting,
      startTime: state.startTime,
      plannedStartTime: state.plannedStartTime,
      presetId: state.presetId,
      goalMinutes: state.goalMinutes,
      customMinutes: state.customMinutes,
      displayMode: state.displayMode,
      note: state.note,
      chimeOn: state.sound,
      notifyOn: state.notifyOn,
      goalNotified: state.goalNotified,
      inspectedHour: state.pinnedHour,
      pinned: state.pinnedHour !== null,
      history: history.slice(-200),
    });
  }

  function announce(text) {
    els.live.textContent = text;
  }

  function setVar(name, value) {
    root.style.setProperty(name, value);
  }

  function goalHours() {
    return state.goalMinutes / 60;
  }

  function progress(now = Date.now()) {
    return state.isFasting && state.startTime !== null ? computeFastProgress(state.startTime, state.goalMinutes, now) : null;
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function clockLabel(ts, now = Date.now()) {
    const d = new Date(ts);
    const hm = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    const day = (x) => {
      const t = new Date(x);
      return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
    };
    const diff = Math.round((day(ts) - day(now)) / 86_400_000);
    if (diff === 0) return hm;
    if (diff === 1) return `tomorrow ${hm}`;
    if (diff === -1) return `yesterday ${hm}`;
    return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]} ${hm}`;
  }

  function dateLabel(ts) {
    const d = new Date(ts);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function toLocalInput(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  // ── Drawing the glass ───────────────────────────────────

  function svg(tag, attrs = {}, parent = null) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    if (parent) parent.appendChild(el);
    return el;
  }

  const f1 = (n) => Math.round(n * 10) / 10;

  // The near half of a level circle at height y and half width a.
  function frontArc(y, a) {
    const r = a * tilt(y);
    return `M${f1(G.cx - a)} ${f1(y)} A${f1(a)} ${f1(r)} 0 0 0 ${f1(G.cx + a)} ${f1(y)}`;
  }

  function backArc(y, a) {
    const r = a * tilt(y);
    return `M${f1(G.cx - a)} ${f1(y)} A${f1(a)} ${f1(r)} 0 0 1 ${f1(G.cx + a)} ${f1(y)}`;
  }

  // A point on that near half, x from the centre.
  function onFront(y, a, dx) {
    const r = a * tilt(y);
    const u = Math.max(-1, Math.min(1, dx / a));
    return y + r * Math.sqrt(1 - u * u);
  }

  function waterPath(yw) {
    const a = innerHalf(yw);
    const ra = a * tilt(yw);
    const b = innerHalf(G.floor);
    const rb = b * tilt(G.floor);
    return `M${f1(G.cx - a)} ${f1(yw)} L${f1(G.cx - b)} ${G.floor} A${f1(b)} ${f1(rb)} 0 0 0 ${f1(G.cx + b)} ${G.floor} L${f1(G.cx + a)} ${f1(yw)} A${f1(a)} ${f1(ra)} 0 0 1 ${f1(G.cx - a)} ${f1(yw)}Z`;
  }

  const parts = {};

  function buildGlass() {
    const g = els.glass;
    g.replaceChildren();
    const defs = svg('defs', {}, g);

    const lin = (id, x2, y2, stops) => {
      const lg = svg('linearGradient', { id, x1: 0, y1: 0, x2, y2 }, defs);
      for (const [offset, cls, extra] of stops) svg('stop', { offset, class: cls, ...(extra || {}) }, lg);
      return lg;
    };
    // Across the water: dark where you look through more of it, at the sides.
    lin('w-x', 1, 0, [[0, 's-w-edge'], [0.14, 's-w-mid'], [0.5, 's-w-mid', { 'stop-opacity': 0.4 }], [0.84, 's-w-mid'], [1, 's-w-edge']]);
    lin('w-y', 0, 1, [[0, 's-w-deep', { 'stop-opacity': 0 }], [1, 's-w-deep']]);
    lin('w-surf', 0, 1, [[0, 's-surf-lo'], [0.55, 's-surf-hi'], [1, 's-surf-lo']]);
    lin('spec-v', 0, 1, [[0, 's-spec-lo'], [0.12, 's-spec-hi'], [0.62, 's-spec-hi', { 'stop-opacity': 0.5 }], [1, 's-spec-lo']]);
    lin('stream', 1, 0, [[0, 's-spec-lo'], [0.35, 's-spec-hi', { 'stop-opacity': 0.55 }], [0.6, 's-spec-hi', { 'stop-opacity': 0.25 }], [1, 's-spec-lo']]);

    const blur = svg('filter', { id: 'soft', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    svg('feGaussianBlur', { stdDeviation: 2.2 }, blur);
    const blurBig = svg('filter', { id: 'softer', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    svg('feGaussianBlur', { stdDeviation: 5 }, blurBig);

    const clip = svg('clipPath', { id: 'w-clip' }, defs);
    parts.clipPath = svg('path', { d: waterPath(G.floor) }, clip);

    const oT = outerHalf(G.rim);
    const oB = outerHalf(G.bottom);
    const iT = innerHalf(G.rim);
    const iF = innerHalf(G.floor);

    // Where it touches the stone.
    svg('ellipse', { cx: G.cx, cy: G.bottom + 3, rx: oB + 4, ry: oB * tilt(G.bottom) + 3, fill: 'rgba(0,0,0,0.28)', filter: 'url(#soft)' }, g);

    // The body of the glass, faintly there even when it is empty.
    svg('path', {
      class: 'g-tint',
      d: `M${f1(G.cx - oT)} ${G.rim} L${f1(G.cx - oB)} ${G.bottom} A${f1(oB)} ${f1(oB * tilt(G.bottom))} 0 0 0 ${f1(G.cx + oB)} ${G.bottom} L${f1(G.cx + oT)} ${G.rim}Z`,
    }, g);
    svg('path', { class: 'g-edge-soft', d: backArc(G.floor, iF) }, g);

    // The water, and the room seen through it. The table's edge drops a
    // little behind the water, which is most of what makes it read as water.
    const water = svg('g', { class: 'water-group' }, g);
    const inside = svg('g', { 'clip-path': 'url(#w-clip)' }, water);
    svg('rect', { class: 'w-wall', x: 0, y: 0, width: 200, height: 440, opacity: 0.4 }, inside);
    svg('rect', { class: 'w-table', x: 0, y: f1(G.horizon + 13), width: 200, height: 200 }, inside);
    svg('rect', { x: 0, y: f1(G.horizon + 13), width: 200, height: 2, fill: 'rgba(255,255,255,0.2)' }, inside);
    svg('rect', { class: 'w-tint', x: 0, y: 0, width: 200, height: 440 }, inside);
    svg('rect', { class: 'w-deep', x: 0, y: G.full, width: 200, height: G.floor - G.full + 30 }, inside);
    // The lamp, bent through the water, lands on the far side.
    svg('rect', { x: G.cx + 30, y: 0, width: 20, height: 440, fill: 'url(#spec-v)', opacity: 0.6, filter: 'url(#soft)' }, inside);

    parts.surface = svg('ellipse', { class: 'w-surface', cx: G.cx, cy: G.floor, rx: 0, ry: 0 }, water);
    parts.meniscusLo = svg('path', { class: 'w-meniscus-lo', d: '' }, water);
    parts.meniscus = svg('path', { class: 'w-meniscus', d: '' }, water);

    // A falling stream while it pours.
    parts.stream = svg('rect', { x: G.cx - 3.2, y: -900, width: 6.4, height: 0, rx: 3, fill: 'url(#stream)', opacity: 0 }, g);

    // What is left once the water is gone.
    const drops = svg('g', { class: 'drops' }, g);
    for (const [x, y, r] of [[-38, 382, 2.2], [-20, 386, 1.4], [12, 384, 1.8], [30, 380, 1.2], [44, 385, 2.4], [-52, 377, 1.1]]) {
      svg('ellipse', { cx: G.cx + x, cy: y, rx: r * 1.4, ry: r * 0.6 }, drops);
    }

    // The thick base, which gathers the light.
    svg('path', {
      class: 'g-base',
      d: `M${f1(G.cx - innerHalf(G.floor) - G.wall)} ${G.floor} L${f1(G.cx - oB)} ${G.bottom} A${f1(oB)} ${f1(oB * tilt(G.bottom))} 0 0 0 ${f1(G.cx + oB)} ${G.bottom} L${f1(G.cx + outerHalf(G.floor))} ${G.floor} A${f1(outerHalf(G.floor))} ${f1(outerHalf(G.floor) * tilt(G.floor))} 0 0 1 ${f1(G.cx - outerHalf(G.floor))} ${G.floor}Z`,
    }, g);
    svg('ellipse', { cx: G.cx + 10, cy: G.bottom - 6, rx: 30, ry: 5, class: 'g-spec', opacity: 0.45, filter: 'url(#soft)' }, g);
    svg('path', { class: 'g-edge-soft', d: frontArc(G.floor, iF) }, g);
    svg('path', { class: 'g-edge', d: frontArc(G.bottom, oB) }, g);

    // Marks go on the front face.
    parts.marks = svg('g', { class: 'marks' }, g);

    // Walls: dark where you look through the glass edge-on.
    svg('path', { class: 'g-edge', d: `M${f1(G.cx - oT)} ${G.rim} L${f1(G.cx - oB)} ${G.bottom}` }, g);
    svg('path', { class: 'g-edge', d: `M${f1(G.cx + oT)} ${G.rim} L${f1(G.cx + oB)} ${G.bottom}` }, g);
    svg('path', { class: 'g-edge-soft', d: `M${f1(G.cx - iT)} ${G.rim + 2} L${f1(G.cx - iF)} ${G.floor}` }, g);
    svg('path', { class: 'g-edge-soft', d: `M${f1(G.cx + iT)} ${G.rim + 2} L${f1(G.cx + iF)} ${G.floor}` }, g);

    // The lamp on the near side, a long soft streak and a hard line beside it.
    svg('path', {
      d: `M${f1(G.cx - oT + 9)} ${G.rim + 20} L${f1(G.cx - oT + 17)} ${G.rim + 20} L${f1(G.cx - oB + 16)} ${G.floor - 10} L${f1(G.cx - oB + 9)} ${G.floor - 10}Z`,
      fill: 'url(#spec-v)',
      opacity: 0.8,
      filter: 'url(#soft)',
    }, g);
    svg('path', {
      d: `M${f1(G.cx - oT + 4.2)} ${G.rim + 10} L${f1(G.cx - oB + 4.2)} ${G.bottom - 14}`,
      stroke: 'url(#spec-v)',
      'stroke-width': 1.3,
      fill: 'none',
    }, g);
    svg('path', {
      d: `M${f1(G.cx + oT - 7)} ${G.rim + 30} L${f1(G.cx + oB - 6.5)} ${G.floor - 30}`,
      stroke: 'url(#spec-v)',
      'stroke-width': 2,
      fill: 'none',
      opacity: 0.45,
    }, g);

    // The lip.
    svg('ellipse', { class: 'g-edge-soft', cx: G.cx, cy: G.rim + 1, rx: iT, ry: iT * tilt(G.rim) }, g);
    svg('ellipse', { class: 'g-rim', cx: G.cx, cy: G.rim, rx: oT, ry: oT * tilt(G.rim) }, g);
    svg('path', { class: 'g-rim-front', d: frontArc(G.rim + 1.6, oT - 0.6) }, g);

    parts.probe = svg('path', { class: 'probe', d: '' }, g);
  }

  function etchText(parent, x, y, text, extra = {}) {
    svg('text', { class: `etch-s ${extra.cls || ''}`, x: f1(x + 0.5), y: f1(y + 0.7), 'text-anchor': extra.anchor || 'start' }, parent).textContent = text;
    svg('text', { class: `etch ${extra.cls || ''}`, x: f1(x), y: f1(y), 'text-anchor': extra.anchor || 'start' }, parent).textContent = text;
  }

  function etchTick(parent, y, len) {
    const a = outerHalf(y);
    const x0 = G.cx - a + 6;
    const pts = [];
    for (let i = 0; i <= 4; i++) {
      const x = x0 + (len * i) / 4;
      pts.push(`${f1(x)} ${f1(onFront(y, a, x - G.cx))}`);
    }
    const d = `M${pts.join(' L')}`;
    svg('path', { class: 'etch-line-s', d, transform: 'translate(0.4 0.7)' }, parent);
    svg('path', { class: 'etch-line', d }, parent);
    return x0 + len;
  }

  function buildMarks() {
    const m = parts.marks;
    if (!m) return;
    m.replaceChildren();
    const hrs = goalHours();
    const plan = markPlan(hrs);
    const goalY = hourToY(hrs, hrs);
    const labelAt = (h, y, text, cls) => {
      const a = outerHalf(y);
      const x = G.cx - a + 6 + 17;
      etchText(m, x, onFront(y, a, x + 6 - G.cx) + 3.6, text, { cls });
    };

    for (let h = 0; h < hrs; h += plan.tick) {
      const y = hourToY(h, hrs);
      const labelled = h % plan.label === 0 && goalY - y > 24;
      etchTick(m, y, labelled ? 13 : 7);
      if (labelled) labelAt(h, y, String(h));
    }
    etchTick(m, goalY, 13);
    labelAt(hrs, goalY - 1, formatGoalLabel(state.goalMinutes), 'etch-goal');

    // Phase lines and their names, on the far right of the face.
    for (let i = 0; i < PHASES.length; i++) {
      const p = PHASES[i];
      if (p.from >= hrs) break;
      const y = hourToY(p.from, hrs);
      const next = i + 1 < PHASES.length ? Math.min(PHASES[i + 1].from, hrs) : hrs;
      const band = hourToY(next, hrs) - y;
      if (p.from > 0) svg('path', { class: 'etch-phase', d: frontArc(y, innerHalf(y) - 1) }, m);
      if (band >= 13) {
        const a = outerHalf(y);
        const x = G.cx + a - 9;
        etchText(m, x, onFront(y, a, x - 22 - G.cx) + 11, p.name, { anchor: 'end', cls: 'etch-name' });
      }
    }

    els.glass.setAttribute('aria-valuemax', String(Math.max(72, Math.ceil(hrs))));
  }

  function drawWater(level) {
    const yw = levelToY(level);
    const a = innerHalf(yw);
    parts.clipPath.setAttribute('d', waterPath(yw));
    const wet = level > 0.002;
    parts.surface.setAttribute('cy', f1(yw));
    parts.surface.setAttribute('rx', wet ? f1(a) : 0);
    parts.surface.setAttribute('ry', wet ? f1(a * tilt(yw)) : 0);
    parts.meniscus.setAttribute('d', wet ? frontArc(yw, a) : '');
    parts.meniscusLo.setAttribute('d', wet ? frontArc(yw + 1.8, a) : '');
    setVar('--level', level.toFixed(4));
    setVar('--wy', ((G.bottom - yw) / 440).toFixed(4));
    return yw;
  }

  function drawStream(topY, bottomY, alpha) {
    parts.stream.setAttribute('y', f1(topY));
    parts.stream.setAttribute('height', f1(Math.max(0, bottomY - topY)));
    parts.stream.setAttribute('opacity', alpha.toFixed(2));
  }

  // ── Lamp by the clock ───────────────────────────────────
  // A fast runs through the night. The lamp is warm at night and nearer
  // daylight in the middle of the day.

  function lampColor(date = new Date()) {
    const h = date.getHours() + date.getMinutes() / 60;
    const ramp = (a, b, x) => Math.max(0, Math.min(1, (x - a) / (b - a)));
    const day = ramp(6, 8.5, h) * (1 - ramp(17.5, 20.5, h));
    const night = [255, 206, 148];
    const noon = [248, 244, 232];
    return night.map((c, i) => Math.round(c + (noon[i] - c) * day)).join(', ');
  }

  function renderLamp() {
    setVar('--glow-rgb', lampColor());
  }

  // ── Card ────────────────────────────────────────────────

  function defaultHour(prog) {
    return prog ? prog.currentHour : Math.round(goalHours());
  }

  function shownHour(prog) {
    if (state.previewHour !== null) return state.previewHour;
    if (state.pinnedHour !== null) return state.pinnedHour;
    return defaultHour(prog);
  }

  function maxHour() {
    return Math.max(72, Math.ceil(goalHours()));
  }

  function renderCard(prog, now = Date.now()) {
    const h = shownHour(prog);
    const info = getHourBenefit(h);
    const hrs = goalHours();
    els.cardHour.textContent = `Hour ${h}`;
    els.cardPhase.textContent = info.phaseLabel;
    els.cardTitle.textContent = info.title;
    els.cardText.textContent = info.benefit;
    els.cardMeta.textContent = `Fuel: ${info.fuel} · Insulin: ${info.insulin} · ${info.shift}`;

    let when = '';
    if (prog) {
      if (h === prog.currentHour) when = 'now';
      else if (h < prog.currentHour) when = `${formatDurationShort(now - (state.startTime + h * HOUR_MS))} ago`;
      else when = `in ${formatDurationShort(state.startTime + h * HOUR_MS - now)}`;
    } else if (h === Math.round(hrs)) {
      when = 'at the goal';
    } else if (h > hrs) {
      when = 'past the goal';
    }
    els.cardWhen.textContent = when;

    const pinned = state.pinnedHour !== null && state.pinnedHour !== defaultHour(prog);
    els.cardNow.hidden = !pinned;
    els.cardNow.textContent = prog ? 'Back to now' : 'Back to the goal';
    els.cardPrev.disabled = h <= 0;
    els.cardNext.disabled = h >= maxHour();

    // On a wide screen the card hangs at the hour it is about.
    const y = hourToY(Math.min(h, hrs), hrs);
    setVar('--iy', ((G.bottom - y) / 440).toFixed(4));
    const reading = state.previewHour !== null || pinned;
    body.classList.toggle('inspecting', reading && h <= hrs);
    if (parts.probe) parts.probe.setAttribute('d', h <= hrs ? frontArc(y, innerHalf(y)) : '');

    els.glass.setAttribute('aria-valuenow', String(h));
    els.glass.setAttribute('aria-valuetext', `Hour ${h}. ${info.title}`);
  }

  function markNotes(prog) {
    const now = prog ? Math.min(72, prog.currentHour) : null;
    const goal = Number.isInteger(goalHours()) && goalHours() <= 72 ? goalHours() : null;
    if (marked.now !== now) {
      if (marked.now !== null) $(`h-${marked.now}`).classList.remove('is-now');
      if (now !== null) $(`h-${now}`).classList.add('is-now');
      marked.now = now;
    }
    if (marked.goal !== goal) {
      if (marked.goal !== null) $(`h-${marked.goal}`).classList.remove('is-goal');
      if (goal !== null) $(`h-${goal}`).classList.add('is-goal');
      marked.goal = goal;
    }
  }

  // ── Readout ─────────────────────────────────────────────

  function renderFavicon(level, running) {
    const key = `${running}:${Math.round(level * 20)}`;
    if (key === lastFavicon) return;
    lastFavicon = key;
    const top = 6 + 21 * (1 - level);
    const water = running && level > 0
      ? `<path d="M9.3 ${f1(top)}h13.4l-${f1(1.6 * (1 - (top - 6) / 21) + 0.1)} ${f1(27 - top)}H10.9z" fill="#5b93a3"/>`
      : '';
    const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${water}<path d="M7.5 4h17l-2.4 25H9.9z" fill="none" stroke="#283234" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
    els.favicon.href = `data:image/svg+xml,${encodeURIComponent(svgText)}`;
  }

  function render(now = Date.now()) {
    const prog = progress(now);
    const hrs = goalHours();
    const goalLabel = formatGoalLabel(state.goalMinutes);
    const presetLabel = state.presetId !== 'custom' ? PRESETS[state.presetId].label : null;

    body.dataset.state = prog ? 'running' : 'idle';

    if (prog) {
      const level = waterLevel(prog.elapsedMs, prog.goalMs);
      const phase = phaseAt(prog.currentHour);
      body.dataset.phase = phase.id;
      body.classList.toggle('dry', prog.goalReached);
      if (!anim) drawWater(level);

      els.phase.textContent = prog.goalReached ? 'empty · goal reached' : `${phase.name} · hour ${prog.currentHour}`;
      const goalAt = state.startTime + prog.goalMs;
      if (state.displayMode === 'remaining') {
        els.time.textContent = prog.goalReached ? `+${formatHMS(prog.pastGoalMs)}` : formatHMS(prog.remainingMs);
      } else {
        els.time.textContent = formatHMS(prog.elapsedMs);
      }
      if (prog.goalReached) {
        els.status.textContent = `goal reached ${clockLabel(goalAt, now)}\n${formatDurationShort(prog.pastGoalMs)} over`;
      } else if (state.displayMode === 'remaining') {
        els.status.textContent = `left\nempty at ${clockLabel(goalAt, now)}`;
      } else {
        els.status.textContent = `of ${goalLabel}\nempty at ${clockLabel(goalAt, now)}`;
      }
      els.nowTag.textContent = 'now';

      document.title = prog.goalReached
        ? `+${formatDurationShort(prog.pastGoalMs)} · Fasting`
        : `${Math.floor(prog.elapsedMs / HOUR_MS)}h ${pad2(Math.floor((prog.elapsedMs % HOUR_MS) / 60_000))}m · Fasting`;
      renderFavicon(level, true);

      // A tap on the glass when the body changes fuel, two at the goal.
      if (lastPhase !== null && phase.id !== lastPhase && !prog.goalReached) sound.clink(level, 0, 1, true);
      lastPhase = phase.id;
      if (prog.goalReached && !state.goalNotified) {
        state.goalNotified = true;
        persist();
        if (lastHour !== -1) sound.clink(0, 0, 2);
        notifyGoal();
        announce(`Goal of ${goalLabel} reached.`);
      }
      if (prog.currentHour !== lastHour) {
        lastHour = prog.currentHour;
        markNotes(prog);
      }
    } else {
      body.classList.remove('dry');
      body.dataset.phase = 'digestion';
      if (!anim) drawWater(0);
      const planned = state.plannedStartTime && state.plannedStartTime < now ? state.plannedStartTime : null;
      const goalAt = (planned || now) + state.goalMinutes * 60_000;
      els.phase.textContent = presetLabel && presetLabel !== goalLabel ? `${goalLabel} · ${presetLabel}` : goalLabel;
      els.time.textContent = formatHMS(state.goalMinutes * 60_000);
      els.status.textContent = planned
        ? `started ${clockLabel(planned, now)}\nempty at ${clockLabel(goalAt, now)}`
        : `pour to start\nempty at ${clockLabel(goalAt, now)}`;
      document.title = BASE_TITLE;
      renderFavicon(0, false);
      lastHour = -1;
      lastPhase = null;
      markNotes(null);
    }

    // The start button says when.
    if (prog) {
      els.startBtn.textContent = `Started ${clockLabel(state.startTime, now)}`;
    } else if (state.plannedStartTime && state.plannedStartTime < now) {
      els.startBtn.textContent = `Started ${formatDurationShort(now - state.plannedStartTime)} ago`;
    } else {
      els.startBtn.textContent = 'Starts now';
    }

    renderCard(prog, now);
    if (hrs !== renderedGoal) {
      renderedGoal = hrs;
      buildMarks();
    }
  }

  function renderChrome() {
    const running = state.isFasting;
    if (!els.toggleBtn.classList.contains('armed')) els.toggleBtn.textContent = running ? 'End fast' : 'Pour';
    els.discardBtn.hidden = !running;
    els.goalBtn.textContent = `Goal ${formatGoalLabel(state.goalMinutes)}`;
    els.soundBtn.textContent = state.sound ? 'Sound on' : 'Sound off';
    els.soundBtn.setAttribute('aria-pressed', String(state.sound));

    goalButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.preset === state.presetId)));
    els.goalNote.textContent = state.presetId === 'custom'
      ? `${formatGoalLabel(state.goalMinutes)}. Set your own.`
      : PRESETS[state.presetId].note;
    els.customRow.hidden = !state.customOpen;
    els.customHours.value = String(Math.floor(state.customMinutes / 60));
    els.customMinutes.value = String(state.customMinutes % 60);

    const canNotify = typeof Notification !== 'undefined';
    els.notify.disabled = !canNotify || Notification.permission === 'denied';
    els.notify.checked = canNotify && state.notifyOn && Notification.permission === 'granted';

    const ref = running ? state.startTime : (state.plannedStartTime || Date.now());
    els.startInput.value = toLocalInput(ref);
    els.startInput.max = toLocalInput(Date.now());
    els.startNow.hidden = running || !state.plannedStartTime;

    renderLog();
    render();
    wake();
  }

  function renderLog() {
    const stats = computeFastingStats(history);
    els.stats.textContent = stats.count === 0
      ? 'No fasts yet.'
      : `${stats.count} ${stats.count === 1 ? 'fast' : 'fasts'} · longest ${formatDurationShort(stats.longestMs)} · average ${formatDurationShort(stats.avgMs)} · ${stats.goalsMet} reached the goal`;
    els.noteInput.value = state.note;
    els.logEmpty.hidden = history.length > 0;
    els.logList.hidden = history.length === 0;
    els.logActions.hidden = history.length === 0;
    if (history.length === 0 || openPanel !== 'log') return;
    els.logList.replaceChildren();
    [...history].reverse().slice(0, 60).forEach((item) => {
      const li = document.createElement('li');
      const when = document.createElement('span');
      when.className = 'log-when';
      when.textContent = dateLabel(item.startedAt);
      const note = document.createElement('span');
      note.className = 'log-note';
      note.textContent = item.note || (item.goalReached ? `${formatGoalLabel(item.goalMinutes)} goal` : `ended before ${formatGoalLabel(item.goalMinutes)}`);
      const dur = document.createElement('span');
      dur.className = item.goalReached ? 'log-dur met' : 'log-dur';
      dur.textContent = formatDurationShort(item.elapsedMs);
      li.append(when, note, dur);
      els.logList.appendChild(li);
    });
  }

  function showPanel(name) {
    openPanel = name;
    for (const [key, panel] of Object.entries(els.panels)) panel.hidden = key !== name;
    els.goalBtn.setAttribute('aria-expanded', String(name === 'goal'));
    els.startBtn.setAttribute('aria-expanded', String(name === 'start'));
    els.logBtn.setAttribute('aria-expanded', String(name === 'log'));
    if (name === 'log') renderLog();
    if (name === 'start') {
      const ref = state.isFasting ? state.startTime : (state.plannedStartTime || Date.now());
      els.startInput.value = toLocalInput(ref);
      els.startInput.max = toLocalInput(Date.now());
    }
    wake();
  }

  // The chrome leaves while the glass drains and comes back when you move.
  function wake() {
    body.classList.remove('quiet');
    clearTimeout(quietTimer);
    if (!state.isFasting || openPanel) return;
    quietTimer = setTimeout(() => {
      if (state.isFasting && !openPanel) body.classList.add('quiet');
    }, 6000);
  }

  // ── Motion ──────────────────────────────────────────────

  function animateLevel(from, to, seconds, withStream, done) {
    if (anim) cancelAnimationFrame(anim.raf);
    if (reduceMotion || seconds <= 0) {
      anim = null;
      drawWater(to);
      drawStream(-900, -900, 0);
      done();
      return;
    }
    const t0 = Date.now();
    const ms = seconds * 1000;
    anim = { raf: 0 };
    const ease = (x) => 1 - Math.pow(1 - x, 2.2);
    const step = () => {
      const x = Math.min(1, (Date.now() - t0) / ms);
      const lvl = from + (to - from) * ease(x);
      const yw = drawWater(lvl);
      if (withStream) {
        // The stream lands on the water, and its tail falls in at the end.
        const tail = x < 0.84 ? -900 : -900 + (yw + 900) * Math.pow((x - 0.84) / 0.16, 1.6);
        drawStream(tail, yw + 2, x < 0.04 ? x / 0.04 : 1);
      }
      if (x < 1) {
        anim.raf = requestAnimationFrame(step);
        return;
      }
      anim = null;
      drawStream(-900, -900, 0);
      done();
    };
    anim.raf = requestAnimationFrame(step);
  }

  // ── Actions ─────────────────────────────────────────────

  function startFast() {
    const now = Date.now();
    const start = state.plannedStartTime && state.plannedStartTime <= now ? state.plannedStartTime : now;
    state.isFasting = true;
    state.startTime = start;
    state.plannedStartTime = null;
    state.pinnedHour = null;
    state.previewHour = null;
    const prog = computeFastProgress(start, state.goalMinutes, now);
    state.goalNotified = prog.goalReached;
    lastHour = prog.currentHour;
    lastPhase = phaseAt(prog.currentHour).id;
    const target = waterLevel(prog.elapsedMs, prog.goalMs);
    const seconds = 0.9 + 1.7 * target;
    sound.ensure();
    if (target > 0) sound.pour(seconds, 0, target);
    body.classList.add('pouring');
    animateLevel(0, target, target > 0 ? seconds : 0, true, () => body.classList.remove('pouring'));
    showPanel(null);
    renderChrome();
    persist();
    announce(`Fast started ${clockLabel(start, now)}. Goal ${formatGoalLabel(state.goalMinutes)}.`);
  }

  function stopFast(log) {
    const now = Date.now();
    const prog = progress(now);
    if (!prog) return;
    // Under a minute is a slip of the finger, not a fast.
    if (log && prog.elapsedMs >= 60_000) {
      history.push({
        startedAt: state.startTime,
        endedAt: now,
        elapsedMs: prog.elapsedMs,
        goalMinutes: state.goalMinutes,
        goalReached: prog.goalReached,
        note: state.note.trim(),
      });
      state.note = '';
    }
    const from = waterLevel(prog.elapsedMs, prog.goalMs);
    state.isFasting = false;
    state.startTime = null;
    state.plannedStartTime = null;
    state.goalNotified = false;
    state.pinnedHour = null;
    if (from > 0) {
      body.classList.add('draining');
      animateLevel(from, 0, 0.7 + from, false, () => body.classList.remove('draining'));
    }
    sound.clink(from, 0, 1, true);
    renderChrome();
    persist();
    announce(log && prog.elapsedMs >= 60_000 ? `Fast ended after ${formatDurationShort(prog.elapsedMs)} and logged.` : 'Fast discarded.');
  }

  function setGoal(id) {
    if (id === 'custom') {
      state.customOpen = !(state.presetId === 'custom' && state.customOpen);
      state.presetId = 'custom';
      state.goalMinutes = state.customMinutes;
    } else {
      const preset = PRESETS[id];
      if (!preset) return;
      state.presetId = id;
      state.customOpen = false;
      state.goalMinutes = preset.minutes;
    }
    goalChanged();
    if (state.customOpen) els.customHours.focus();
  }

  function applyCustom() {
    const mins = clampGoalMinutes(els.customHours.value, els.customMinutes.value);
    state.presetId = 'custom';
    state.customMinutes = mins;
    state.goalMinutes = mins;
    state.customOpen = false;
    goalChanged();
  }

  function goalChanged() {
    const prog = progress();
    state.goalNotified = prog ? prog.goalReached : false;
    state.pinnedHour = null;
    renderChrome();
    persist();
    announce(`Goal set to ${formatGoalLabel(state.goalMinutes)}.`);
  }

  function setStart(ts) {
    const now = Date.now();
    const next = Math.min(now, ts);
    if (state.isFasting) {
      const before = waterLevel(now - state.startTime, state.goalMinutes * 60_000);
      state.startTime = next;
      const prog = computeFastProgress(next, state.goalMinutes, now);
      state.goalNotified = prog.goalReached;
      lastHour = -1;
      lastPhase = phaseAt(prog.currentHour).id;
      const after = waterLevel(prog.elapsedMs, prog.goalMs);
      animateLevel(before, after, Math.min(1.4, Math.abs(after - before) * 3), false, () => {});
    } else {
      state.plannedStartTime = next >= now - 30_000 ? null : next;
    }
    renderChrome();
    persist();
    announce(`Start set to ${clockLabel(next, now)}.`);
  }

  function shiftStart(hours) {
    const base = state.isFasting ? state.startTime : (state.plannedStartTime || Date.now());
    setStart(base - hours * HOUR_MS);
  }

  function pin(hour) {
    const h = Math.max(0, Math.min(maxHour(), Math.round(hour)));
    state.pinnedHour = h === defaultHour(progress()) ? null : h;
    render();
    persist();
  }

  function stepHour(delta) {
    pin(shownHour(progress()) + delta);
  }

  async function notifyGoal() {
    if (!state.notifyOn || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      // eslint-disable-next-line no-new
      new Notification('The glass is empty', { body: `You reached your ${formatGoalLabel(state.goalMinutes)} goal.`, tag: 'fasting-goal' });
    } catch { /* Some browsers only notify from a service worker. */ }
  }

  // Ending and discarding both ask twice.
  function armable(btn, armedText, hint, action, idleText) {
    let timer = 0;
    const disarm = () => {
      clearTimeout(timer);
      btn.classList.remove('armed');
      btn.textContent = idleText();
    };
    btn.addEventListener('click', () => {
      if (!btn.classList.contains('armed')) {
        btn.classList.add('armed');
        btn.textContent = armedText;
        announce(hint);
        timer = setTimeout(disarm, 3500);
        return;
      }
      disarm();
      action();
    });
    return disarm;
  }

  // ── Events ──────────────────────────────────────────────

  let toggleArmed = false;
  let toggleTimer = 0;
  els.toggleBtn.addEventListener('click', () => {
    if (!state.isFasting) {
      startFast();
      return;
    }
    if (!toggleArmed) {
      toggleArmed = true;
      els.toggleBtn.classList.add('armed');
      els.toggleBtn.textContent = 'End now?';
      announce('Press again to end and log the fast.');
      toggleTimer = setTimeout(() => {
        toggleArmed = false;
        els.toggleBtn.classList.remove('armed');
        renderChrome();
      }, 3500);
      return;
    }
    clearTimeout(toggleTimer);
    toggleArmed = false;
    els.toggleBtn.classList.remove('armed');
    stopFast(true);
  });

  armable(els.discardBtn, 'Discard?', 'Press again to throw this fast away without logging it.', () => stopFast(false), () => 'Discard');
  armable(els.logClear, 'Clear every fast?', 'Press again to clear the log.', () => {
    history = [];
    renderLog();
    persist();
    announce('Log cleared.');
  }, () => 'Clear');

  els.logCopy.addEventListener('click', () => {
    const lines = [...history].reverse().map((item) => `${dateLabel(item.startedAt)}\t${formatDurationShort(item.elapsedMs)}\t${item.goalReached ? 'goal' : 'early'} (${formatGoalLabel(item.goalMinutes)})${item.note ? `\t${item.note}` : ''}`);
    const text = lines.join('\n');
    const done = () => {
      els.logCopy.textContent = 'Copied';
      setTimeout(() => { els.logCopy.textContent = 'Copy'; }, 1600);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => {});
    } catch { /* Clipboard is not available here. */ }
  });

  goalButtons.forEach((btn) => btn.addEventListener('click', () => setGoal(btn.dataset.preset)));
  els.customApply.addEventListener('click', applyCustom);
  [els.customHours, els.customMinutes].forEach((input) => input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCustom();
    }
  }));

  els.notify.addEventListener('change', async () => {
    if (typeof Notification === 'undefined') return;
    if (els.notify.checked && Notification.permission === 'default') {
      try {
        state.notifyOn = (await Notification.requestPermission()) === 'granted';
      } catch {
        state.notifyOn = false;
      }
    } else {
      state.notifyOn = els.notify.checked && Notification.permission === 'granted';
    }
    renderChrome();
    persist();
  });

  els.startInput.addEventListener('change', () => {
    const t = new Date(els.startInput.value).getTime();
    if (Number.isNaN(t)) return;
    setStart(t);
  });
  els.earlier1.addEventListener('click', () => shiftStart(1));
  els.earlier2.addEventListener('click', () => shiftStart(2));
  els.startNow.addEventListener('click', () => {
    state.plannedStartTime = null;
    renderChrome();
    persist();
    announce('Starts now.');
  });

  els.soundBtn.addEventListener('click', toggleSound);
  els.goalBtn.addEventListener('click', () => showPanel(openPanel === 'goal' ? null : 'goal'));
  els.startBtn.addEventListener('click', () => showPanel(openPanel === 'start' ? null : 'start'));
  els.logBtn.addEventListener('click', () => showPanel(openPanel === 'log' ? null : 'log'));

  els.noteInput.addEventListener('input', () => {
    state.note = els.noteInput.value;
    persist();
  });

  els.time.addEventListener('click', toggleDisplay);
  els.cardPrev.addEventListener('click', () => stepHour(-1));
  els.cardNext.addEventListener('click', () => stepHour(1));
  els.cardNow.addEventListener('click', () => {
    state.pinnedHour = null;
    render();
    persist();
  });

  function toggleSound() {
    state.sound = !state.sound;
    sound.setOn(state.sound);
    renderChrome();
    persist();
    announce(state.sound ? 'Sound on.' : 'Sound off.');
  }

  function toggleDisplay() {
    state.displayMode = state.displayMode === 'elapsed' ? 'remaining' : 'elapsed';
    render();
    persist();
  }

  // Read the glass with a finger or a pointer: hover to look, press to keep.
  function hourAtPointer(e) {
    const rect = els.glass.getBoundingClientRect();
    if (!rect || !rect.height) return null;
    const y = ((e.clientY - rect.top) / rect.height) * 440;
    const f = (y - G.full) / (G.floor - G.full);
    return Math.max(0, Math.min(Math.floor(goalHours()), Math.floor(f * goalHours())));
  }

  let dragging = false;
  els.glass.addEventListener('pointerdown', (e) => {
    const h = hourAtPointer(e);
    if (h === null) return;
    dragging = true;
    try { els.glass.setPointerCapture(e.pointerId); } catch { /* Fine without capture. */ }
    state.previewHour = null;
    pin(h);
  });
  els.glass.addEventListener('pointermove', (e) => {
    const h = hourAtPointer(e);
    if (h === null) return;
    if (dragging) {
      if (h !== shownHour(progress())) pin(h);
      return;
    }
    if (e.pointerType === 'mouse' && h !== state.previewHour) {
      state.previewHour = h;
      render();
    }
  });
  const endDrag = () => {
    dragging = false;
  };
  els.glass.addEventListener('pointerup', endDrag);
  els.glass.addEventListener('pointercancel', endDrag);
  els.glass.addEventListener('pointerleave', () => {
    if (state.previewHour === null) return;
    state.previewHour = null;
    render();
  });
  els.glass.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') stepHour(-1);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') stepHour(1);
    else if (e.key === 'Home') pin(0);
    else if (e.key === 'End') pin(goalHours());
    else return;
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('pointerdown', (e) => {
    if (!openPanel) return;
    const t = e.target;
    const inChrome = t && t.closest && t.closest('.chrome');
    if (!inChrome) showPanel(null);
  });

  document.addEventListener('pointermove', wake);
  document.addEventListener('focusin', wake);

  document.addEventListener('keydown', (e) => {
    wake();
    if (e.key === 'Escape') {
      if (openPanel) showPanel(null);
      else if (state.pinnedHour !== null) {
        state.pinnedHour = null;
        render();
        persist();
      }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'A') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (!state.isFasting) startFast();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      stepHour(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      stepHour(1);
    } else if (e.key === 't' || e.key === 'T') {
      toggleDisplay();
    } else if (e.key === 'm' || e.key === 'M') {
      toggleSound();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) persist();
    else {
      renderLamp();
      render();
    }
  });
  window.addEventListener('pagehide', persist);

  // Sound can only start after a gesture. A fast that was already running
  // when the page opened gets its context on the first touch.
  const unlock = () => {
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
    sound.ensure();
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);

  // ── Start ───────────────────────────────────────────────

  buildGlass();
  renderLamp();
  {
    const prog = progress();
    if (prog) {
      lastHour = prog.currentHour;
      lastPhase = phaseAt(prog.currentHour).id;
      if (prog.goalReached) state.goalNotified = true;
    }
  }
  renderChrome();
  setInterval(render, 1000);
  setInterval(renderLamp, 60_000);
})(typeof window !== 'undefined' ? window : globalThis);
