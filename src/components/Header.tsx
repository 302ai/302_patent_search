import { useTranslation } from "react-i18next";

export default function Header() {
  const showBrand = import.meta.env.VITE_APP_SHOW_BRAND === "true"
  const { t } = useTranslation();
  return <div className="relative flex justify-center items-center lg:my-8 my-4 gap-1">
    {
      showBrand &&
      <img src="https://file.302.ai/gpt/imgs/5b36b96aaa052387fb3ccec2a063fe1e.png" alt="302" height={60} width={60} />
    }
    <div className="text-[28px] font-bold">{t("header.title")}</div>
  </div>
}