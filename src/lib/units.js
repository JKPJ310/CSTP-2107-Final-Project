const CM_PER_INCH = 2.54;
const KG_PER_LB = 0.45359237;

const round1 = (n) => Math.round(n * 10) / 10;

// Height from the sign-up answers in cm (null if not given)
export const heightInCm = (answers) => {
    if (answers.units === 'imperial') {
        if (answers.heightFt === '' && answers.heightIn === '') return null;
        return round1((Number(answers.heightFt || 0) * 12 + Number(answers.heightIn || 0)) * CM_PER_INCH);
    }
    return answers.heightCm === '' ? null : round1(Number(answers.heightCm));
}

// Weight from the sign-up answers in kg (null if not given)
export const weightInKg = (answers) => {
    if (answers.weight === '') return null;
    const weight = Number(answers.weight);
    return round1(answers.units === 'imperial' ? weight * KG_PER_LB : weight);
}
