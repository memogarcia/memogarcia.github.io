((globalScope) => {
  const STORAGE_KEY = 'memo-tools-fasting-v1';
  const RING_RADIUS = 158;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const PRESETS = {
    '12h': { id: '12h', label: '12:12', minutes: 12 * 60 },
    '14h': { id: '14h', label: '14:10', minutes: 14 * 60 },
    '16h': { id: '16h', label: '16:8', minutes: 16 * 60 },
    '18h': { id: '18h', label: '18:6', minutes: 18 * 60 },
    '20h': { id: '20h', label: '20:4', minutes: 20 * 60 },
    '24h': { id: '24h', label: 'OMAD', minutes: 24 * 60 },
    '36h': { id: '36h', label: '36h', minutes: 36 * 60 },
    '48h': { id: '48h', label: '48h', minutes: 48 * 60 },
    '72h': { id: '72h', label: '72h', minutes: 72 * 60 },
  };

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

  function computeFastProgress(startTimeMs, goalMinutes, nowMs = Date.now()) {
    const goalMs = Math.max(60 * 60_000, goalMinutes * 60_000);
    const elapsedMs = Math.max(0, nowMs - startTimeMs);
    const remainingMs = goalMs - elapsedMs;
    const pct = (elapsedMs / goalMs) * 100;
    const currentHour = Math.floor(elapsedMs / 3_600_000);
    const minutesIntoHour = Math.floor((elapsedMs % 3_600_000) / 60_000);
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

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      PRESETS,
      HOUR_BENEFITS,
      MILESTONE_HOURS,
      getHourBenefit,
      clampTotalGoalMinutes,
      clampGoalMinutes,
      formatGoalLabel,
      formatHMS,
      computeFastProgress,
      computeFastingStats,
    };
  }

  if (typeof document === 'undefined') return;

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
    } catch {
      /* Continue in memory when storage is blocked. */
    }
  }

  function formatShortDateTime(ts) {
    const d = new Date(ts);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mon = months[d.getMonth()];
    const day = d.getDate();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${mon} ${day}, ${hh}:${mm}`;
  }

  function toLocalDateTimeInputValue(ts) {
    const d = new Date(ts);
    const offset = d.getTimezoneOffset() * 60_000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  }

  function formatDurationShort(ms) {
    const totalMin = Math.max(0, Math.round(ms / 60_000));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  function playGoalChime() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime + 0.02;
      [
        { freq: 432, amp: 0.22, dur: 3.0 },
        { freq: 433.5, amp: 0.14, dur: 2.8 },
        { freq: 864, amp: 0.07, dur: 1.9 },
      ].forEach(({ freq, amp, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(amp, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.05);
      });
    } catch {}
  }

  const els = {
    body: document.body,
    favicon: document.getElementById('favicon'),
    presetChips: [...document.querySelectorAll('.preset-chip[data-preset]')],
    customGoalBtn: document.getElementById('custom-goal-btn'),
    customGoalPanel: document.getElementById('custom-goal-panel'),
    customHours: document.getElementById('custom-hours'),
    customMinutes: document.getElementById('custom-minutes'),
    applyCustomBtn: document.getElementById('apply-custom-btn'),
    milestonesGroup: document.getElementById('dial-milestones'),
    progressRing: document.getElementById('dial-progress'),
    handGroup: document.getElementById('dial-hand-group'),
    eyebrow: document.getElementById('phase-eyebrow'),
    timeDisplay: document.getElementById('time-display'),
    progressLine: document.getElementById('progress-line'),
    scheduleLine: document.getElementById('schedule-line'),
    modeElapsedBtn: document.getElementById('mode-elapsed-btn'),
    modeRemainingBtn: document.getElementById('mode-remaining-btn'),
    startTimeSummary: document.getElementById('start-time-summary'),
    shiftMinus1h: document.getElementById('shift-minus-1h'),
    shiftMinus2h: document.getElementById('shift-minus-2h'),
    editStartBtn: document.getElementById('edit-start-btn'),
    editStartPanel: document.getElementById('edit-start-panel'),
    startDatetime: document.getElementById('start-datetime'),
    saveStartBtn: document.getElementById('save-start-btn'),
    resetStartNowBtn: document.getElementById('reset-start-now-btn'),
    cancelStartBtn: document.getElementById('cancel-start-btn'),
    noteInput: document.getElementById('fast-note-input'),
    toggleBtn: document.getElementById('toggle-btn'),
    discardBtn: document.getElementById('discard-btn'),
    soundQuickBtn: document.getElementById('sound-quick-btn'),
    notifyBtn: document.getElementById('notify-btn'),
    liveStatus: document.getElementById('live-status'),
    spotlightCard: document.getElementById('spotlight-card'),
    spotlightBadge: document.getElementById('spotlight-badge'),
    spotlightPhase: document.getElementById('spotlight-phase'),
    spotlightStatus: document.getElementById('spotlight-status'),
    spotlightTitle: document.getElementById('spotlight-title'),
    spotlightBenefit: document.getElementById('spotlight-benefit'),
    markerFuel: document.getElementById('marker-fuel'),
    markerInsulin: document.getElementById('marker-insulin'),
    markerShift: document.getElementById('marker-shift'),
    hourProgressWrap: document.getElementById('hour-progress-wrap'),
    hourProgressFill: document.getElementById('hour-progress-fill'),
    hourProgressLabel: document.getElementById('hour-progress-label'),
    nextHourPreview: document.getElementById('next-hour-preview'),
    prevHourBtn: document.getElementById('prev-hour-btn'),
    currentHourBtn: document.getElementById('current-hour-btn'),
    nextHourBtn: document.getElementById('next-hour-btn'),
    hourMatrix: document.getElementById('hour-matrix'),
    inspBadge: document.getElementById('insp-badge'),
    inspPhase: document.getElementById('insp-phase'),
    inspRel: document.getElementById('insp-rel'),
    inspTitle: document.getElementById('insp-title'),
    inspBenefit: document.getElementById('insp-benefit'),
    inspFuel: document.getElementById('insp-fuel'),
    inspInsulin: document.getElementById('insp-insulin'),
    inspShift: document.getElementById('insp-shift'),
    filterChips: [...document.querySelectorAll('.filter-chip[data-filter]')],
    hourlyList: document.getElementById('hourly-list'),
    statsSummary: document.getElementById('stats-summary'),
    historyCount: document.getElementById('history-count'),
    historyEmpty: document.getElementById('history-empty'),
    historyList: document.getElementById('history-list'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
  };

  els.progressRing.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
  els.progressRing.style.strokeDashoffset = `${RING_CIRCUMFERENCE}`;

  const saved = loadStore();
  let history = Array.isArray(saved?.history) ? saved.history : [];

  const initialPresetId = saved?.presetId && (saved.presetId === 'custom' || PRESETS[saved.presetId])
    ? saved.presetId
    : '16h';
  const initialGoalMin = Number.isFinite(Number(saved?.goalMinutes))
    ? clampTotalGoalMinutes(saved.goalMinutes)
    : PRESETS['16h'].minutes;

  const state = {
    isFasting: Boolean(saved?.isFasting && typeof saved?.startTime === 'number'),
    startTime: typeof saved?.startTime === 'number' ? saved.startTime : null,
    plannedStartTime: typeof saved?.plannedStartTime === 'number' ? saved.plannedStartTime : null,
    presetId: initialPresetId,
    goalMinutes: initialPresetId === 'custom' ? initialGoalMin : PRESETS[initialPresetId].minutes,
    customMinutes: Number.isFinite(Number(saved?.customMinutes)) ? clampTotalGoalMinutes(saved.customMinutes) : 17 * 60,
    displayMode: saved?.displayMode === 'remaining' ? 'remaining' : 'elapsed',
    note: typeof saved?.note === 'string' ? saved.note : '',
    chimeOn: saved?.chimeOn !== false,
    notifyOn: Boolean(saved?.notifyOn),
    goalNotified: Boolean(saved?.goalNotified),
    editingStart: false,
    customOpen: initialPresetId === 'custom',
    inspectedHour: 16,
    filter: 'all',
  };

  els.noteInput.value = state.note;

  let tickTimer = null;
  let lastRenderedHour = -1;
  let lastFaviconBucket = '';
  const hourMatrixCells = [];
  let milestoneDots = [];

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
      chimeOn: state.chimeOn,
      notifyOn: state.notifyOn,
      goalNotified: state.goalNotified,
      history: history.slice(-100),
    });
  }

  function announce(text) {
    els.liveStatus.textContent = text;
  }

  function buildDialMilestones() {
    els.milestonesGroup.replaceChildren();
    milestoneDots = [];
    const goalHours = state.goalMinutes / 60;
    for (const h of MILESTONE_HOURS) {
      if (h > goalHours) continue;
      const frac = h / goalHours;
      const angle = frac * 2 * Math.PI - Math.PI / 2;
      const cx = (180 + RING_RADIUS * Math.cos(angle)).toFixed(2);
      const cy = (180 + RING_RADIUS * Math.sin(angle)).toFixed(2);
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', cx);
      dot.setAttribute('cy', cy);
      dot.setAttribute('r', h === Math.round(goalHours) ? '4.5' : '3.2');
      dot.dataset.hour = String(h);
      els.milestonesGroup.appendChild(dot);
      milestoneDots.push({ hour: h, el: dot });
    }
  }

  function buildHourMatrix() {
    els.hourMatrix.replaceChildren();
    hourMatrixCells.length = 0;
    for (let h = 0; h < HOUR_BENEFITS.length; h++) {
      const item = HOUR_BENEFITS[h];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hour-cell';
      btn.dataset.hour = String(h);
      btn.dataset.phase = item.phase;
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', 'false');
      btn.textContent = `${h}h`;
      btn.title = `Hour ${h}: ${item.title}`;
      btn.addEventListener('click', () => {
        state.inspectedHour = h;
        renderInspector();
        highlightHourlyList();
      });
      els.hourMatrix.appendChild(btn);
      hourMatrixCells.push(btn);
    }
  }

  function filteredHours() {
    const goalHour = Math.min(72, Math.ceil(state.goalMinutes / 60));
    return HOUR_BENEFITS.filter((item) => {
      if (state.filter === 'all') return true;
      if (state.filter === 'goal') return item.hour <= goalHour;
      if (state.filter === '0-11') return item.hour >= 0 && item.hour <= 11;
      if (state.filter === '12-23') return item.hour >= 12 && item.hour <= 23;
      if (state.filter === '24-47') return item.hour >= 24 && item.hour <= 47;
      if (state.filter === '48-72') return item.hour >= 48 && item.hour <= 72;
      return true;
    });
  }

  function buildHourlyList() {
    els.hourlyList.replaceChildren();
    const list = filteredHours();
    const goalHour = Math.round(state.goalMinutes / 60);
    const nowMs = Date.now();
    const activeStart = state.isFasting ? state.startTime : null;
    const currentElapsedH = activeStart !== null ? Math.floor(Math.max(0, nowMs - activeStart) / 3_600_000) : -1;

    list.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'hourly-item';
      li.dataset.hour = String(item.hour);
      li.tabIndex = 0;

      const isPassed = activeStart !== null && item.hour < currentElapsedH;
      const isCurrent = activeStart !== null && item.hour === currentElapsedH;
      if (isPassed) li.classList.add('is-passed');
      if (isCurrent) li.classList.add('is-current');
      if (item.hour === state.inspectedHour) li.classList.add('is-selected');

      const hourCol = document.createElement('div');
      hourCol.className = 'hourly-item-hour';
      const hourText = document.createElement('span');
      hourText.textContent = `${item.hour}h`;
      const stateText = document.createElement('span');
      stateText.className = 'hourly-item-state';
      if (isCurrent) stateText.textContent = 'Now';
      else if (isPassed) stateText.textContent = 'Passed';
      else if (item.hour === goalHour) stateText.textContent = 'Goal';
      else if (activeStart !== null) stateText.textContent = formatShortDateTime(activeStart + item.hour * 3_600_000);
      else stateText.textContent = item.hour === goalHour ? 'Goal' : '';
      hourCol.append(hourText, stateText);

      const contentCol = document.createElement('div');
      const top = document.createElement('div');
      top.className = 'hourly-item-top';
      const title = document.createElement('h3');
      title.className = 'hourly-item-title';
      title.textContent = item.title;
      const phase = document.createElement('span');
      phase.className = 'hourly-item-phase';
      phase.textContent = item.phaseLabel;
      top.append(title, phase);

      const desc = document.createElement('p');
      desc.className = 'hourly-item-desc';
      desc.textContent = item.benefit;

      const tags = document.createElement('p');
      tags.className = 'hourly-item-tags';
      tags.textContent = `Fuel: ${item.fuel} · Insulin: ${item.insulin} · ${item.shift}`;

      contentCol.append(top, desc, tags);
      li.append(hourCol, contentCol);

      const selectThis = () => {
        state.inspectedHour = item.hour;
        renderInspector();
        highlightHourlyList();
      };
      li.addEventListener('click', selectThis);
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectThis();
        }
      });

      els.hourlyList.appendChild(li);
    });
  }

  function highlightHourlyList() {
    const items = els.hourlyList.querySelectorAll('.hourly-item');
    items.forEach((el) => {
      el.classList.toggle('is-selected', Number(el.dataset.hour) === state.inspectedHour);
    });
  }

  function updateHourMatrixStates(currentHour, isFasting) {
    const goalHour = Math.round(state.goalMinutes / 60);
    hourMatrixCells.forEach((cell) => {
      const h = Number(cell.dataset.hour);
      cell.classList.toggle('passed', isFasting && h < currentHour);
      cell.classList.toggle('current', isFasting && h === currentHour);
      cell.classList.toggle('goal', h === goalHour);
      cell.setAttribute('aria-selected', String(h === state.inspectedHour));
    });
  }

  function renderInspector() {
    const h = Math.max(0, Math.min(72, state.inspectedHour));
    const item = getHourBenefit(h);
    const goalHour = Math.round(state.goalMinutes / 60);

    els.inspBadge.textContent = `Hour ${item.hour}`;
    els.inspPhase.textContent = item.phaseLabel;
    els.inspTitle.textContent = item.title;
    els.inspBenefit.textContent = item.benefit;
    els.inspFuel.textContent = `Fuel: ${item.fuel}`;
    els.inspInsulin.textContent = `Insulin: ${item.insulin}`;
    els.inspShift.textContent = `Shift: ${item.shift}`;

    if (state.isFasting && state.startTime !== null) {
      const prog = computeFastProgress(state.startTime, state.goalMinutes);
      if (h < prog.currentHour) {
        els.inspRel.textContent = 'Completed in this fast';
      } else if (h === prog.currentHour) {
        els.inspRel.textContent = 'Active hour now';
      } else {
        const at = formatShortDateTime(state.startTime + h * 3_600_000);
        els.inspRel.textContent = h === goalHour ? `Goal hour · ${at}` : `Reached at ${at}`;
      }
    } else {
      els.inspRel.textContent = h === goalHour ? 'Selected goal hour' : `Hour ${h} of 72`;
    }

    els.prevHourBtn.disabled = h <= 0;
    els.nextHourBtn.disabled = h >= 72;
    updateHourMatrixStates(
      state.isFasting && state.startTime !== null ? computeFastProgress(state.startTime, state.goalMinutes).currentHour : -1,
      state.isFasting,
    );
  }

  function renderSpotlight(progress) {
    const activeHour = state.isFasting ? progress.currentHour : 0;
    const item = getHourBenefit(activeHour);
    const nextItem = getHourBenefit(activeHour + 1);

    els.body.dataset.phase = item.phase;
    els.spotlightBadge.textContent = `Hour ${activeHour}`;
    els.spotlightPhase.textContent = item.phaseLabel;
    els.spotlightTitle.textContent = item.title;
    els.spotlightBenefit.textContent = item.benefit;
    els.markerFuel.textContent = `Fuel: ${item.fuel}`;
    els.markerInsulin.textContent = `Insulin: ${item.insulin}`;
    els.markerShift.textContent = `Shift: ${item.shift}`;

    if (state.isFasting) {
      els.spotlightStatus.textContent = progress.goalReached ? 'Goal reached' : 'Active now';
      els.hourProgressWrap.hidden = false;
      const pctInHour = (progress.minutesIntoHour / 60) * 100;
      els.hourProgressFill.style.width = `${pctInHour.toFixed(1)}%`;
      const minsLeft = 60 - progress.minutesIntoHour;
      els.hourProgressLabel.textContent = `${progress.minutesIntoHour}m / 60m (${minsLeft}m to ${activeHour + 1}h)`;
      els.nextHourPreview.textContent = `Next (Hour ${activeHour + 1}): ${nextItem.title}`;
    } else {
      els.spotlightStatus.textContent = 'Hour 0 preview';
      els.hourProgressWrap.hidden = true;
      els.nextHourPreview.textContent = `Next (Hour 1): ${nextItem.title}`;
    }
  }

  function updateFavicon(ringProgress, phase, isFasting) {
    const bucket = `${phase}:${isFasting}:${Math.round(ringProgress * 20)}`;
    if (bucket === lastFaviconBucket) return;
    lastFaviconBucket = bucket;

    const palette = {
      digestion: '#8a6434',
      glycogen: '#9c4a2d',
      ketosis: '#364a32',
      autophagy: '#2e4c66',
      extended: '#59446b',
    };
    const stroke = palette[phase] || '#364a32';
    const r = 12;
    const c = 2 * Math.PI * r;
    const offset = isFasting ? c * (1 - Math.max(0, Math.min(1, ringProgress))) : c;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#faf7f2"/><circle cx="16" cy="16" r="12" fill="none" stroke="#e2ddd2" stroke-width="3"/><circle cx="16" cy="16" r="12" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 16 16)"/><circle cx="16" cy="16" r="3" fill="${stroke}"/></svg>`;
    els.favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function renderDialAndSpotlight() {
    const now = Date.now();
    const goalText = formatGoalLabel(state.goalMinutes);

    if (!state.isFasting || state.startTime === null) {
      const startPreview = state.plannedStartTime && state.plannedStartTime <= now ? state.plannedStartTime : now;
      const goalAt = startPreview + state.goalMinutes * 60_000;
      const prog = state.plannedStartTime && state.plannedStartTime < now
        ? computeFastProgress(state.plannedStartTime, state.goalMinutes, now)
        : null;

      els.progressRing.style.strokeDashoffset = `${RING_CIRCUMFERENCE}`;
      els.handGroup.setAttribute('transform', 'rotate(0 180 180)');
      milestoneDots.forEach(({ el }) => el.classList.remove('reached'));

      const presetMeta = state.presetId !== 'custom' && PRESETS[state.presetId].label !== goalText
        ? ` (${PRESETS[state.presetId].label})`
        : '';
      els.eyebrow.textContent = `Goal · ${goalText}${presetMeta}`;
      els.timeDisplay.textContent = formatHMS(state.goalMinutes * 60_000);
      els.progressLine.textContent = prog
        ? `Backdated start: ${formatHMS(prog.elapsedMs)} already elapsed`
        : 'Ready to start';
      els.scheduleLine.textContent = `Goal reached at ${formatShortDateTime(goalAt)}`;
      els.startTimeSummary.textContent = state.plannedStartTime && state.plannedStartTime < now
        ? `Start time: ${formatShortDateTime(state.plannedStartTime)}`
        : 'Start time: Now';

      document.title = 'Fasting · Memo Garcia';
      renderSpotlight({ currentHour: 0, minutesIntoHour: 0, goalReached: false });
      updateFavicon(0, 'digestion', false);
      return;
    }

    const prog = computeFastProgress(state.startTime, state.goalMinutes, now);
    const currentItem = getHourBenefit(prog.currentHour);

    // Check goal reached chime/alert once
    if (prog.goalReached && !state.goalNotified) {
      state.goalNotified = true;
      if (state.chimeOn) playGoalChime();
      if (state.notifyOn && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('Fasting goal reached', { body: `You reached your ${goalText} goal.` });
        } catch {}
      }
      persist();
    }

    const offset = RING_CIRCUMFERENCE * (1 - prog.ringProgress);
    els.progressRing.style.strokeDashoffset = `${offset.toFixed(2)}`;
    els.handGroup.setAttribute('transform', `rotate(${(prog.ringProgress * 360).toFixed(2)} 180 180)`);
    milestoneDots.forEach(({ hour, el }) => {
      el.classList.toggle('reached', prog.elapsedMs >= hour * 3_600_000);
    });

    els.eyebrow.textContent = `${currentItem.phaseLabel} · Hour ${prog.currentHour}`;

    if (state.displayMode === 'remaining') {
      els.timeDisplay.textContent = prog.goalReached
        ? `+${formatHMS(prog.pastGoalMs)}`
        : formatHMS(prog.remainingMs);
      els.progressLine.textContent = `${formatHMS(prog.elapsedMs)} elapsed · ${Math.round(prog.pct)}% of ${goalText}`;
    } else {
      els.timeDisplay.textContent = formatHMS(prog.elapsedMs);
      els.progressLine.textContent = prog.goalReached
        ? `Goal reached (+${formatHMS(prog.pastGoalMs)}) · ${Math.round(prog.pct)}%`
        : `${formatHMS(prog.remainingMs)} left · ${Math.round(prog.pct)}% of ${goalText}`;
    }

    const goalAt = state.startTime + prog.goalMs;
    els.scheduleLine.textContent = prog.goalReached
      ? `Reached ${goalText} at ${formatShortDateTime(goalAt)}`
      : `Goal at ${formatShortDateTime(goalAt)}`;
    els.startTimeSummary.textContent = `Started: ${formatShortDateTime(state.startTime)}`;

    document.title = `${formatHMS(prog.elapsedMs)} · Fasting · Memo Garcia`;

    renderSpotlight(prog);
    updateFavicon(prog.ringProgress, currentItem.phase, true);

    if (prog.currentHour !== lastRenderedHour) {
      lastRenderedHour = prog.currentHour;
      updateHourMatrixStates(prog.currentHour, true);
      buildHourlyList();
      renderInspector();
    }
  }

  function renderHistory() {
    const stats = computeFastingStats(history);
    if (stats.count === 0) {
      els.statsSummary.textContent = '0 completed fasts';
    } else {
      els.statsSummary.textContent = `${stats.count} ${stats.count === 1 ? 'fast' : 'fasts'} · longest ${formatDurationShort(stats.longestMs)} · avg ${formatDurationShort(stats.avgMs)} · ${stats.goalsMet} goal met`;
    }

    els.historyCount.textContent = String(history.length);
    els.historyEmpty.hidden = history.length > 0;
    els.historyList.hidden = history.length === 0;
    els.clearHistoryBtn.hidden = history.length === 0;

    if (history.length > 0) {
      els.historyList.replaceChildren();
      [...history].reverse().forEach((item) => {
        const li = document.createElement('li');
        const timeSpan = document.createElement('span');
        timeSpan.className = 'history-time';
        timeSpan.textContent = `${formatShortDateTime(item.startedAt)} to ${formatShortDateTime(item.endedAt)}`;

        const noteSpan = document.createElement('span');
        noteSpan.className = item.note ? 'history-note' : 'history-note empty-note';
        noteSpan.textContent = item.note || (item.goalReached ? `Goal reached (${formatGoalLabel(item.goalMinutes)})` : `Ended early (goal ${formatGoalLabel(item.goalMinutes)})`);

        const durSpan = document.createElement('span');
        durSpan.className = 'history-dur';
        durSpan.textContent = formatDurationShort(item.elapsedMs);

        li.append(timeSpan, noteSpan, durSpan);
        els.historyList.appendChild(li);
      });
    }
  }

  function renderChrome() {
    els.body.dataset.state = state.isFasting ? 'running' : 'idle';

    els.presetChips.forEach((chip) => {
      const id = chip.dataset.preset;
      if (id === 'custom') {
        chip.setAttribute('aria-pressed', String(state.presetId === 'custom'));
        chip.textContent = state.presetId === 'custom'
          ? `Custom (${formatGoalLabel(state.goalMinutes)})`
          : 'Custom';
      } else {
        chip.setAttribute('aria-pressed', String(state.presetId === id));
      }
    });

    els.customGoalPanel.hidden = !state.customOpen;
    els.customHours.value = String(Math.floor(state.goalMinutes / 60));
    els.customMinutes.value = String(state.goalMinutes % 60);

    els.modeElapsedBtn.setAttribute('aria-pressed', String(state.displayMode === 'elapsed'));
    els.modeRemainingBtn.setAttribute('aria-pressed', String(state.displayMode === 'remaining'));

    els.editStartPanel.hidden = !state.editingStart;
    if (state.editingStart) {
      const refTs = state.isFasting ? state.startTime : (state.plannedStartTime || Date.now());
      els.startDatetime.value = toLocalDateTimeInputValue(refTs);
      els.startDatetime.max = toLocalDateTimeInputValue(Date.now());
    }

    els.toggleBtn.textContent = state.isFasting ? 'End Fast' : 'Start Fast';
    els.discardBtn.hidden = !state.isFasting;

    els.soundQuickBtn.textContent = state.chimeOn ? 'Chime: On' : 'Chime: Off';
    els.soundQuickBtn.setAttribute('aria-pressed', String(state.chimeOn));

    if (typeof Notification === 'undefined') {
      els.notifyBtn.textContent = 'Alerts: Off';
      els.notifyBtn.disabled = true;
    } else if (Notification.permission === 'denied') {
      els.notifyBtn.textContent = 'Alerts: Blocked';
      state.notifyOn = false;
    } else {
      const active = state.notifyOn && Notification.permission === 'granted';
      els.notifyBtn.textContent = active ? 'Alerts: On' : 'Alerts: Off';
      els.notifyBtn.setAttribute('aria-pressed', String(active));
    }

    els.filterChips.forEach((chip) => {
      chip.setAttribute('aria-pressed', String(chip.dataset.filter === state.filter));
    });

    buildDialMilestones();
    renderDialAndSpotlight();
    buildHourlyList();
    renderInspector();
    renderHistory();
  }

  function startTicker() {
    if (tickTimer !== null) clearInterval(tickTimer);
    tickTimer = setInterval(() => {
      renderDialAndSpotlight();
    }, 1000);
  }

  function selectPreset(id) {
    if (id === 'custom') {
      state.presetId = 'custom';
      state.customOpen = true;
      state.goalMinutes = state.customMinutes;
      state.goalNotified = state.isFasting && state.startTime !== null
        ? computeFastProgress(state.startTime, state.goalMinutes).goalReached
        : false;
      state.inspectedHour = Math.min(72, Math.round(state.goalMinutes / 60));
      renderChrome();
      persist();
      els.customHours.focus();
      announce(`Custom goal selected: ${formatGoalLabel(state.goalMinutes)}.`);
      return;
    }

    const preset = PRESETS[id];
    if (!preset) return;
    state.presetId = id;
    state.customOpen = false;
    state.goalMinutes = preset.minutes;
    state.goalNotified = state.isFasting && state.startTime !== null
      ? computeFastProgress(state.startTime, state.goalMinutes).goalReached
      : false;
    state.inspectedHour = Math.min(72, Math.round(preset.minutes / 60));
    renderChrome();
    persist();
    announce(`Goal set to ${formatGoalLabel(preset.minutes)}.`);
  }

  function applyCustomGoal() {
    const mins = clampGoalMinutes(els.customHours.value, els.customMinutes.value);
    state.presetId = 'custom';
    state.customMinutes = mins;
    state.goalMinutes = mins;
    state.customOpen = true;
    state.goalNotified = state.isFasting && state.startTime !== null
      ? computeFastProgress(state.startTime, state.goalMinutes).goalReached
      : false;
    state.inspectedHour = Math.min(72, Math.round(mins / 60));
    renderChrome();
    persist();
    announce(`Custom goal updated to ${formatGoalLabel(mins)}.`);
  }

  function shiftStartByHours(deltaHours) {
    const now = Date.now();
    const base = state.isFasting ? state.startTime : (state.plannedStartTime || now);
    const next = Math.min(now, base + deltaHours * 3_600_000);
    if (state.isFasting) {
      state.startTime = next;
      state.goalNotified = computeFastProgress(state.startTime, state.goalMinutes).goalReached;
      lastRenderedHour = -1;
    } else {
      state.plannedStartTime = next;
    }
    renderChrome();
    persist();
    announce(`Start time moved to ${formatShortDateTime(next)}.`);
  }

  function toggleFast() {
    const now = Date.now();
    if (!state.isFasting) {
      const start = state.plannedStartTime && state.plannedStartTime <= now ? state.plannedStartTime : now;
      state.isFasting = true;
      state.startTime = start;
      state.plannedStartTime = null;
      state.editingStart = false;
      const prog = computeFastProgress(start, state.goalMinutes, now);
      state.goalNotified = prog.goalReached;
      state.inspectedHour = Math.min(72, prog.currentHour);
      lastRenderedHour = prog.currentHour;
      renderChrome();
      persist();
      announce(`Fast started at ${formatShortDateTime(start)}.`);
      return;
    }

    const elapsedMs = Math.max(0, now - state.startTime);
    const goalMs = state.goalMinutes * 60_000;
    history.push({
      startedAt: state.startTime,
      endedAt: now,
      elapsedMs,
      goalMinutes: state.goalMinutes,
      goalReached: elapsedMs >= goalMs,
      note: state.note.trim(),
    });
    state.isFasting = false;
    state.startTime = null;
    state.plannedStartTime = null;
    state.editingStart = false;
    state.goalNotified = false;
    state.note = '';
    els.noteInput.value = '';
    lastRenderedHour = -1;
    renderChrome();
    persist();
    announce(`Fast ended after ${formatDurationShort(elapsedMs)} and logged.`);
  }

  // --- Event Listeners ---
  els.presetChips.forEach((chip) => {
    chip.addEventListener('click', () => selectPreset(chip.dataset.preset));
  });

  els.applyCustomBtn.addEventListener('click', applyCustomGoal);
  [els.customHours, els.customMinutes].forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyCustomGoal();
      }
    });
  });

  els.modeElapsedBtn.addEventListener('click', () => {
    state.displayMode = 'elapsed';
    renderChrome();
    persist();
  });

  els.modeRemainingBtn.addEventListener('click', () => {
    state.displayMode = 'remaining';
    renderChrome();
    persist();
  });

  els.shiftMinus1h.addEventListener('click', () => shiftStartByHours(-1));
  els.shiftMinus2h.addEventListener('click', () => shiftStartByHours(-2));

  els.editStartBtn.addEventListener('click', () => {
    state.editingStart = !state.editingStart;
    renderChrome();
    if (state.editingStart) els.startDatetime.focus();
  });

  els.saveStartBtn.addEventListener('click', () => {
    const parsed = new Date(els.startDatetime.value);
    if (Number.isNaN(parsed.getTime())) {
      announce('Enter a valid start date and time.');
      return;
    }
    const clamped = Math.min(Date.now(), parsed.getTime());
    if (state.isFasting) {
      state.startTime = clamped;
      state.goalNotified = computeFastProgress(clamped, state.goalMinutes).goalReached;
      lastRenderedHour = -1;
    } else {
      state.plannedStartTime = clamped;
    }
    state.editingStart = false;
    renderChrome();
    persist();
    announce(`Start time set to ${formatShortDateTime(clamped)}.`);
  });

  els.resetStartNowBtn.addEventListener('click', () => {
    const now = Date.now();
    if (state.isFasting) {
      state.startTime = now;
      state.goalNotified = false;
      lastRenderedHour = -1;
    } else {
      state.plannedStartTime = null;
    }
    state.editingStart = false;
    renderChrome();
    persist();
    announce('Start time reset to now.');
  });

  els.cancelStartBtn.addEventListener('click', () => {
    state.editingStart = false;
    renderChrome();
  });

  els.noteInput.addEventListener('input', () => {
    state.note = els.noteInput.value;
    persist();
  });

  els.toggleBtn.addEventListener('click', toggleFast);

  els.discardBtn.addEventListener('click', () => {
    if (!state.isFasting) return;
    if (!window.confirm('Discard the current active fast without logging it?')) return;
    state.isFasting = false;
    state.startTime = null;
    state.plannedStartTime = null;
    state.editingStart = false;
    state.goalNotified = false;
    lastRenderedHour = -1;
    renderChrome();
    persist();
    announce('Active fast discarded.');
  });

  els.soundQuickBtn.addEventListener('click', () => {
    state.chimeOn = !state.chimeOn;
    renderChrome();
    persist();
    announce(state.chimeOn ? 'Goal chime enabled.' : 'Goal chime muted.');
  });

  els.notifyBtn.addEventListener('click', async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      try {
        const res = await Notification.requestPermission();
        state.notifyOn = res === 'granted';
      } catch {
        state.notifyOn = false;
      }
    } else if (Notification.permission === 'granted') {
      state.notifyOn = !state.notifyOn;
    }
    renderChrome();
    persist();
  });

  els.prevHourBtn.addEventListener('click', () => {
    if (state.inspectedHour > 0) {
      state.inspectedHour -= 1;
      renderInspector();
      highlightHourlyList();
    }
  });

  els.nextHourBtn.addEventListener('click', () => {
    if (state.inspectedHour < 72) {
      state.inspectedHour += 1;
      renderInspector();
      highlightHourlyList();
    }
  });

  els.currentHourBtn.addEventListener('click', () => {
    if (state.isFasting && state.startTime !== null) {
      state.inspectedHour = Math.min(72, computeFastProgress(state.startTime, state.goalMinutes).currentHour);
    } else {
      state.inspectedHour = Math.min(72, Math.round(state.goalMinutes / 60));
    }
    renderInspector();
    highlightHourlyList();
  });

  els.filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      state.filter = chip.dataset.filter;
      els.filterChips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      buildHourlyList();
      highlightHourlyList();
    });
  });

  els.clearHistoryBtn.addEventListener('click', () => {
    history = [];
    renderChrome();
    persist();
    announce('Cleared fasting log.');
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderDialAndSpotlight();
  });

  buildHourMatrix();
  if (state.isFasting && state.startTime !== null) {
    const initialProg = computeFastProgress(state.startTime, state.goalMinutes);
    state.inspectedHour = Math.min(72, initialProg.currentHour);
    lastRenderedHour = initialProg.currentHour;
  } else {
    state.inspectedHour = Math.min(72, Math.round(state.goalMinutes / 60));
  }
  renderChrome();
  startTicker();
})(typeof window !== 'undefined' ? window : globalThis);
