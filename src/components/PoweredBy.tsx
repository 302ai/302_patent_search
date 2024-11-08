import { useTranslation } from "react-i18next";

export default function PoweredBy() {
    const region = import.meta.env.VITE_APP_REGION;
  const { t } = useTranslation();

    return <div
        className="flex justify-center items-center flex-col my-3 "
        style={{ color: "rgb(102, 102, 102)", fontSize: "12px" }}
    >
        <div>
            {t("powered_by")}
        </div>
        <div className="flex justify-center items-center gap-1">
            Powered By
            <a target="_blank" href={region ? "https://302.ai/" : "https://302ai.cn/"}><img className="object-contain" src="https://file.302.ai/gpt/imgs/91f7b86c2cf921f61e8cf9dc7b1ec5ee.png" alt="gpt302" width="55" /></a>
        </div>
    </div >
}