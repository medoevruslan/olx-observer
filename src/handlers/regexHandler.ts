import { CardViewDto } from "../dto/CardViewDto.ts";

export type CardRegex = { brand: RegExp; model: RegExp | null };

export function filterByRegex(
  { regex, data }: { regex: CardRegex; data: CardViewDto[] },
  regexForModel: boolean
) {
  const { brand, model } = regex;

  return regexForModel && model
    ? data.filter((el) => brand.test(el.name) && model.test(el.name))
    : data.filter((el) => brand.test(el.name));
}

export function createRegex({
  regex,
  regexModelTxt,
}: {
  regex: string;
  regexModelTxt: string | null | undefined;
}) {
  let model = null;
  const brand = new RegExp(regex, "i");
  if (regexModelTxt) {
    model = new RegExp(regexModelTxt, "i");
  }

  return { brand, model };
}
