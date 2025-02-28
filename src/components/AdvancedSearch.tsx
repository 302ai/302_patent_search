import dayjs from 'dayjs';
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import codes from '../../public/codes.json';
import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { useAppSelector } from "../store/hooks";
import MultipleSelector from "./MultipleSelector";
import { DateTimePicker } from "./DateTimePicker";
import { selectGlobal } from "../store/globalSlice";
import { zhTW, enUS, jaHira } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useTranslation } from 'react-i18next';

export interface ISearchData {
  sort_by: string;
  countries: Array<Option>;
  patent_language: Array<Option>;
  patent_status: string;
  patent_type: string;
  time_type: string;
  start_time: Date | undefined,
  end_time: Date | undefined,
}

export interface Option {
  value: string;
  label: string;
  disable?: boolean;
  fixed?: boolean;
  [key: string]: string | boolean | undefined;
}

const defaultSearchData: ISearchData = {
  sort_by: '',
  countries: [],
  patent_language: [],
  patent_status: '',
  patent_type: '',
  time_type: '',
  start_time: undefined,
  end_time: undefined,
}

export function PopoverDemo() {
  const { t } = useTranslation();
  const global = useAppSelector(selectGlobal)
  const [selectOpen, setSelectOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [languageOptions, useLanguageOptions] = useState<Array<Option>>([]);
  const [countriesOptions, useCountriesOptions] = useState<Array<Option>>([]);
  const [searchData, setSearchData] = useState<ISearchData>(defaultSearchData);

  const SORTBY = [
    { value: 'relevance', label: t("sortby.relevance") },
    { value: '-submitted_date', label: t("sortby.submitted_date") },
  ]

  const LANGUAGE = [
    { value: 'ARABIC', label: t("language.arabic") },
    { value: 'CHINESE', label: t("language.Chinese") },
    { value: 'DANISH', label: t("language.Danish") },
    { value: 'DUTCH', label: t("language.Dutch") },
    { value: 'ENGLISH', label: t("language.English") },
    { value: 'FINNISH', label: t("language.Finnish") },
    { value: 'FRENCH', label: t("language.French") },
    { value: 'GERMAN', label: t("language.German") },
    { value: 'ITALIAN', label: t("language.Italian") },
    { value: 'JAPANESE', label: t("language.Japanese") },
    { value: 'KOREAN', label: t("language.Korean") },
    { value: 'NORWEGIAN', label: t("language.Norwegian") },
    { value: 'PORTUGUESE', label: t("language.Portuguese") },
    { value: 'RUSSIAN', label: t("language.Russian") },
    { value: 'SPANISH', label: t("language.Spanish") },
    { value: 'SWEDISH', label: t("language.Swedish") },
  ];

  const STATUS = [
    { value: 'GRANT', label: t("status.authorized_patent") },
    { value: 'APPLICATION', label: t("status.patent_application") },
  ]

  const TYPE = [
    { value: 'PATENT', label: t("type.patent") },
    { value: 'DESIGN', label: t("type.design_patent") },
  ]

  const DATE = [
    { value: 'priority', label: t("date.priority") },
    { value: 'filing', label: t("date.filing") },
    { value: 'publication', label: t("date.publication") },
  ]

  useEffect(() => {
    const temp: Array<Option> = [];
    for (let index = 0; index < codes.length; index++) {
      const label = codes[index][`country_name_${global.language}`]
      temp.push({ label, value: codes[index].country_code, ...codes[index] })
    }
    useCountriesOptions(() => temp)
  }, [global.language])

  useEffect(() => {
    const temp: Array<Option> = [];
    for (let index = 0; index < LANGUAGE.length; index++) {
      temp.push({ ...LANGUAGE[index] })
    }
    useLanguageOptions(() => temp)
  }, [global.language])

  useEffect(() => {
    if (popoverOpen) {
      const SEARCH_TEMP = localStorage.getItem('SEARCH');
      try {
        const data = JSON.parse(SEARCH_TEMP || '{}');
        if (data) {
          let [start_time, end_time]: [any, any] = [undefined, undefined];
          if (data.start_time) {
            start_time = new Date(data.start_time)
          }
          if (data.end_time) {
            end_time = new Date(data.end_time)
          }
          setSearchData(() => ({ ...data, start_time, end_time }))
        }
      } catch (error) {
        setSearchData(() => ({ ...defaultSearchData }))
      }
    }
  }, [popoverOpen])

  const onReset = () => {
    setSearchData(() => ({ ...defaultSearchData }))
    localStorage.setItem('SEARCH', JSON.stringify(defaultSearchData));
  }

  const onSubmit = () => {
    let [start_time, end_time] = ['', ''];
    if (searchData.start_time) {
      start_time = dayjs(searchData.start_time).format('YYYY-MM-DD')
    }
    if (searchData.end_time) {
      end_time = dayjs(searchData.end_time).format('YYYY-MM-DD')
    }
    localStorage.setItem('SEARCH', JSON.stringify({
      ...searchData,
      start_time,
      end_time,
    }));
  }

  const onCloseSvg = () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.877075 7.49988C0.877075 3.84219 3.84222 0.877045 7.49991 0.877045C11.1576 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1575 0.877075 7.49988ZM7.49991 1.82704C4.36689 1.82704 1.82708 4.36686 1.82708 7.49988C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49988C13.1727 4.36686 10.6329 1.82704 7.49991 1.82704ZM9.85358 5.14644C10.0488 5.3417 10.0488 5.65829 9.85358 5.85355L8.20713 7.49999L9.85358 9.14644C10.0488 9.3417 10.0488 9.65829 9.85358 9.85355C9.65832 10.0488 9.34173 10.0488 9.14647 9.85355L7.50002 8.2071L5.85358 9.85355C5.65832 10.0488 5.34173 10.0488 5.14647 9.85355C4.95121 9.65829 4.95121 9.3417 5.14647 9.14644L6.79292 7.49999L5.14647 5.85355C4.95121 5.65829 4.95121 5.3417 5.14647 5.14644C5.34173 4.95118 5.65832 4.95118 5.85358 5.14644L7.50002 6.79289L9.14647 5.14644C9.34173 4.95118 9.65832 4.95118 9.85358 5.14644Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    </svg>
  )

  const handleOutsideClick = (open: boolean) => {
    if (!selectOpen) {
      if (!open) {
        onSubmit();
      }
      setPopoverOpen(open);
    }
  };

  const onResetOne = (name: string, data: any) => {
    if (name === 'time') {
      setSearchData((v) => ({ ...v, start_time: undefined, end_time: undefined }))
    } else {
      setSearchData((v) => ({ ...v, [name]: data }))
    }
  }

  const onSelect = (data: Array<any>, name: string, placeholder: string) => {
    return (
      <Select value={(searchData as any)[name]} onOpenChange={setSelectOpen} onValueChange={(value: any) => { setSearchData((v) => ({ ...v, [name]: value })) }}>
        <SelectTrigger>
          <SelectValue placeholder={<span className="text-muted-foreground">{placeholder}</span>} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {data.map((item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  const onCountries = () => {
    const sortedData = searchData?.countries?.sort((a, b) => {
      if (a.value === 'WO') return -1;
      if (b.value === 'WO') return 1;
      return 0;
    });
    return sortedData?.map(item => ({ ...item })) || [];
  }

  return (
    <Popover open={popoverOpen} onOpenChange={handleOutsideClick}>
      <PopoverTrigger asChild>
        <Button variant="outline" onClick={() => setPopoverOpen((prev) => !prev)}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.5 3C4.67157 3 4 3.67157 4 4.5C4 5.32843 4.67157 6 5.5 6C6.32843 6 7 5.32843 7 4.5C7 3.67157 6.32843 3 5.5 3ZM3 5C3.01671 5 3.03323 4.99918 3.04952 4.99758C3.28022 6.1399 4.28967 7 5.5 7C6.71033 7 7.71978 6.1399 7.95048 4.99758C7.96677 4.99918 7.98329 5 8 5H13.5C13.7761 5 14 4.77614 14 4.5C14 4.22386 13.7761 4 13.5 4H8C7.98329 4 7.96677 4.00082 7.95048 4.00242C7.71978 2.86009 6.71033 2 5.5 2C4.28967 2 3.28022 2.86009 3.04952 4.00242C3.03323 4.00082 3.01671 4 3 4H1.5C1.22386 4 1 4.22386 1 4.5C1 4.77614 1.22386 5 1.5 5H3ZM11.9505 10.9976C11.7198 12.1399 10.7103 13 9.5 13C8.28967 13 7.28022 12.1399 7.04952 10.9976C7.03323 10.9992 7.01671 11 7 11H1.5C1.22386 11 1 10.7761 1 10.5C1 10.2239 1.22386 10 1.5 10H7C7.01671 10 7.03323 10.0008 7.04952 10.0024C7.28022 8.8601 8.28967 8 9.5 8C10.7103 8 11.7198 8.8601 11.9505 10.0024C11.9668 10.0008 11.9833 10 12 10H13.5C13.7761 10 14 10.2239 14 10.5C14 10.7761 13.7761 11 13.5 11H12C11.9833 11 11.9668 10.9992 11.9505 10.9976ZM8 10.5C8 9.67157 8.67157 9 9.5 9C10.3284 9 11 9.67157 11 10.5C11 11.3284 10.3284 12 9.5 12C8.67157 12 8 11.3284 8 10.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent asChild className={`sm:w-[500px] w-screen overflow-y-auto popoverContent`} style={{ maxHeight: `calc(100vh -  ${isMobile ? 190 : 300}px)` }}>
        <div>
          <div>
            <h4 className="font-bold leading-none m-0">{t("search_title")}</h4>
          </div>

          <div className="grid ">
            <div className="items-center my-3">
              <Label htmlFor="sort_by" className="min-w-14">{t("search.sort_by")}</Label>
              <div className="flex">
                {onSelect(SORTBY, 'sort_by', t("search.sort_by_tips"))}
                <Button className="ml-2" variant="ghost" onClick={() => { onResetOne('sort_by', '') }}>{onCloseSvg()}</Button>
              </div>
            </div>

            <div className="items-center mb-3">
              <Label htmlFor="countries" className="min-w-14">{t("search.countries")}</Label>
              <div className="flex">
                <MultipleSelector
                  delay={0}
                  triggerSearchOnFocus
                  hideClearAllButton
                  // @ts-ignore
                  value={onCountries()}
                  defaultOptions={countriesOptions}
                  placeholder={t("search.countries_tips")}
                  onChange={(options: Option[]) => { setSearchData((v) => ({ ...v, countries: options })) }}
                  onSearch={async (value) => {
                    if (!value) { return countriesOptions }
                    const res = countriesOptions.filter((option) => option.label.includes(value));
                    return res;
                  }}
                  emptyIndicator={
                    <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                      {t("search.patent_language_empty")}
                    </p>
                  }
                />
                <Button className="ml-2" variant="ghost" onClick={() => { onResetOne('countries', []) }}>{onCloseSvg()}</Button>
              </div>
            </div>

            <div className="items-center mb-3">
              <Label htmlFor="patent_language" className="min-w-14">{t("search.patent_language")}</Label>
              <div className="flex">
                <MultipleSelector
                  delay={0}
                  triggerSearchOnFocus
                  hideClearAllButton
                  // @ts-ignore
                  value={searchData?.patent_language?.map(item => ({ ...item })) || []}
                  defaultOptions={languageOptions}
                  placeholder={t("search.patent_language_tips")}
                  onChange={(options: Option[]) => { setSearchData((v) => ({ ...v, patent_language: options })) }}
                  onSearch={async (value) => {
                    if (!value) { return languageOptions }
                    const res = languageOptions.filter((option) => option.label.includes(value));
                    return res;
                  }}
                  emptyIndicator={
                    <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                      {t("search.patent_language_empty")}
                    </p>
                  }
                />
                <Button className="ml-2" variant="ghost" onClick={() => { onResetOne('patent_language', []) }}>{onCloseSvg()}</Button>
              </div>
            </div>

            <div className="items-center mb-3">
              <Label htmlFor="patent_status" className="min-w-14">{t("search.patent_status")}</Label>
              <div className="flex">
                {onSelect(STATUS, 'patent_status', t("search.patent_status_tips"))}
                <Button className="ml-2" variant="ghost" onClick={() => { onResetOne('patent_status', '') }}>{onCloseSvg()}</Button>
              </div>
            </div>

            <div className="items-center mb-3">
              <Label htmlFor="patent_type">{t("search.patent_type")}</Label>
              <div className="flex">
                {onSelect(TYPE, 'patent_type', t("search.patent_type_tips"))}
                <Button className="ml-2" variant="ghost" onClick={() => { onResetOne('patent_type', '') }}>{onCloseSvg()}</Button>
              </div>
            </div>

            <div className="items-center mb-3">
              <Label htmlFor="time_type">{t("search.time")}</Label>
              <div className="flex">
                {onSelect(DATE, 'time_type', t("search.time_tips"))}
                <Button className="ml-2" variant="ghost" onClick={() => { onResetOne('time_type', '') }}>{onCloseSvg()}</Button>
              </div>
            </div>

            <div className="flex w-full items-center">
              <div className="grid grid-cols-2 gap-3 w-full">
                <DateTimePicker
                  displayFormat={{ hour24: 'yyy/MM/dd' }}
                  placeholder={t("search.start_time")}
                  locale={global.language === 'zh' ? zhTW : global.language === 'ja' ? jaHira : enUS}
                  granularity="day" value={searchData.start_time}
                  onChange={(date) => { setSearchData((v) => ({ ...v, start_time: date })) }}
                />
                <DateTimePicker
                  granularity="day"
                  value={searchData.end_time}
                  displayFormat={{ hour24: 'yyy/MM/dd' }}
                  placeholder={t("search.end_time")}
                  locale={global.language === 'zh' ? zhTW : global.language === 'ja' ? jaHira : enUS}
                  onChange={(date) => { setSearchData((v) => ({ ...v, end_time: date })) }}
                />
              </div>
              <Button className="ml-2  felx-1" variant="ghost" onClick={() => { onResetOne('time', '') }}>{onCloseSvg()}</Button>
            </div>

            <div className="flex justify-between mt-5">
              <Button variant="ghost" onClick={onReset}>{t("search.reset")}</Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
