import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { IoLanguage } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectGlobal, setGlobalState } from "../store/globalSlice";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";

export function LanguagePopover() {
  const dispatch = useAppDispatch()
  const { t, i18n } = useTranslation();
  const global = useAppSelector(selectGlobal)
  return (
    <Popover>
      <PopoverTrigger>
        <IoLanguage className="text-[19px] cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="w-full p-1">
        <RadioGroup
          className='gap-0'
          defaultValue={global.language}
          value={global.language}
          onValueChange={(value: "zh" | "en" | "ja") => {
            localStorage.setItem('language', value)
            dispatch(setGlobalState({ language: value }))
            i18n.changeLanguage(value);
            document.title = t("header.title")
          }}>
          <Button size='sm' variant="ghost" className="flex justify-start hover:text-[#8e47f0] w-full" >
            <RadioGroupItem className="min-w-[15px] max-h-[15px]" value="zh" id="r1" />
            <Label className='leading-[2.7] text-left cursor-pointer ml-3 w-full h-full' htmlFor="r1">中文</Label>
          </Button>
          <Button size='sm' variant="ghost" className="flex justify-start hover:text-[#8e47f0] w-full" >
            <RadioGroupItem className="min-w-[15px] max-h-[15px]" value="en" id="r2" />
            <Label className='leading-[2.7] text-left cursor-pointer ml-3 w-full h-full' htmlFor="r2">English</Label>
          </Button>
          <Button size='sm' variant="ghost" className="flex justify-start hover:text-[#8e47f0] w-full" >
            <RadioGroupItem className="min-w-[15px] max-h-[15px]" value="ja" id="r3" />
            <Label className='leading-[2.7] text-left cursor-pointer ml-3 w-full h-full' htmlFor="r3">日本語</Label>
          </Button>
        </RadioGroup>
      </PopoverContent>
    </Popover>
  )
}
