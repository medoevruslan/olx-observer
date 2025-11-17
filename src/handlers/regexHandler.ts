import { CardViewDto } from "../dto/CardViewDto.ts";

export type CardRegex = { brand: RegExp; model: RegExp | null };

export function filterByRegex(
  { regex, data }: { regex: CardRegex; data: CardViewDto[] },
  isRegexModel: boolean
) {
  const { brand, model } = regex;

  return isRegexModel && model
    ? data.filter((el) => model.test(el.name))
    : data.filter((el) => brand.test(el.name));
}

export function createRegex({
  regexBrand,
  regexModel,
}: {
  regexBrand: string;
  regexModel: string | null | undefined;
}): CardRegex {
  let model = null;
  const brand = new RegExp(regexBrand, "i");
  if (regexModel) {
    model = new RegExp(regexModel, "i");
  }

  return { brand, model };
}
