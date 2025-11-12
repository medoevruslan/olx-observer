export function filterByRegex(
  { regex: { brand, model }, data },
  regexForModel
) {
  return regexForModel && model
    ? data.filter((el) => brand.test(el.name) && model?.test(el.name))
    : data.filter((el) => brand.test(el.name));
}

export function createRegex({
  regex,
  regexModelTxt,
}: {
  regex: string;
  regexModelTxt?: string;
}) {
  let model = null;
  const brand = new RegExp(regex, "i");
  if (regexModelTxt) {
    model = new RegExp(regexModelTxt, "i");
  }
  return { brand, model };
}
