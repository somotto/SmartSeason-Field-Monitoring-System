const computeStatus = (field) => {
  const { current_stage, planting_date, last_updated } = field;

  if (current_stage === 'harvested') return 'completed';

  const today = new Date();
  const planted = new Date(planting_date);
  const daysSincePlanting = Math.floor((today - planted) / (1000 * 60 * 60 * 24));

  if (current_stage === 'ready' && daysSincePlanting > 180) return 'at_risk';
  if (current_stage === 'growing' && daysSincePlanting > 120) return 'at_risk';
  if (current_stage === 'planted' && daysSincePlanting > 30) return 'at_risk';

  return 'active';
};

module.exports = { computeStatus };