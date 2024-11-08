import { toast } from "react-toastify";
import Header from "./components/Header";
import { cn, getLanguage } from "./utils";
import { useEffect, useState } from "react";
import { Button, Input } from "./components";
import 'react-toastify/dist/ReactToastify.css';
import PoweredBy from "./components/PoweredBy";
import { useTranslation } from 'react-i18next';
import { Spinner, Tooltip } from "@radix-ui/themes";
import { ErrMessage } from "./components/ErrMessage";
import { DataSource, IPatentList } from "./interface";
import DocumentDialog from "./components/DocumentDialog";
import { PopoverDemo } from "./components/AdvancedSearch";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { LanguagePopover } from "./components/LanguagePopover";
import { languageList } from "./constant/language";
import { selectGlobal, setGlobalState, setQuery } from "./store/globalSlice";

const region = import.meta.env.VITE_APP_REGION;
const apiKey = import.meta.env.VITE_APP_API_KEY;
const modelName = import.meta.env.VITE_APP_MODEL_NAME;
const showBrand = import.meta.env.VITE_APP_SHOW_BRAND === "true"
const FETCH_INIT: RequestInit = { method: "post", headers: { "accept": "application/json", "Content-Type": "application/json" } }

function App() {
  const { t, i18n } = useTranslation();

  const dispatch = useAppDispatch()
  const global = useAppSelector(selectGlobal)

  const [language, setLanguage] = useState('Chinese')
  const [translateSearchTerms, setTranslateSearchTerms] = useState(false);
  const [dataSource, setdataSource] = useState<DataSource>({ total_results: 0, next_page: false, list: [] })
  const [searchQuery, setSearchQuer] = useState({ querying: false, query: '', oldQuery: '', sort_by: 'relevance', currentPage: 1, });

  useEffect(() => {
    const lang = getLanguage()
    console.log(lang);

    i18n.changeLanguage(lang);
    dispatch(setGlobalState({ language: lang }))
  }, [])

  useEffect(() => {
    const userLanguage = window.navigator.language
    const languageCode = userLanguage.split('-')[0];
    const matchedLanguage = languageList.find(lang => lang.code === languageCode);
    if (matchedLanguage) {
      setLanguage(matchedLanguage.value);
    } else {
      setLanguage('Chinese');
    }
  }, [])

  // Search Patent List
  const getArxiv = async (offset: number = 1) => {
    const query = searchQuery?.query.trimStart().trimEnd() || searchQuery?.oldQuery;
    const searchUrl = import.meta.env.VITE_APP_SEARCH_URL;
    const SEARCH_TEMP = localStorage.getItem('SEARCH');
    const advancedSearchData = JSON.parse(SEARCH_TEMP || '{}');
    if (!query || !query.length) {
      const dom = document.getElementById("query-input")
      if (dom) {
        dom.style.border = "1px solid #ad383c"
        setTimeout(() => { dom.style.border = "" }, 1000)
      }
      return
    }
    setSearchQuer((v) => ({ ...v, querying: true }))

    const language = global.language.charAt(0).toUpperCase() + global.language.slice(1)

    const bodyQuer: { [key: string]: any } = {
      query,
      id_list: [],
      page: offset,
      max_results: 10,
      sort_by: searchQuery?.sort_by,
      language,
      api_key: apiKey,
      models_name: modelName,
    }
    for (const key in advancedSearchData) {
      if (advancedSearchData[key] && advancedSearchData[key].length > 0) {
        if (['countries', 'patent_language'].includes(key)) {
          bodyQuer[key] = advancedSearchData[key].map((f: any) => f.value).join(',');
        } else {
          bodyQuer[key] = advancedSearchData[key];
        }
      }
    }

    const onUpDateParameter = (res: { data: { total_results: number, next_page: boolean, olist: IPatentList[] } }) => {
      dispatch(setQuery({ query, currentPage: offset, sort_by: searchQuery.sort_by }))
      setSearchQuer((v) => ({ ...v, currentPage: offset, query: query, oldQuery: query }))
      setdataSource(() => ({
        total_results: res.data.total_results,
        next_page: res.data.next_page,
        list: res.data.olist
      }))
    }

    if (!/[^\w\s\d\p{P}\p{Emoji}]/gu.test(query.trimStart().trimEnd())) {
      fetch(searchUrl, { ...FETCH_INIT, body: JSON.stringify(bodyQuer) })
        .then(res => res.text())
        .then(res => JSON.parse(res))
        .then(res => {
          if (res.data?.err_code || res.data?.error_code) {
            toast(ErrMessage(res.data?.err_code || res.data?.error_code, global.language, region), { autoClose: false })
            return
          }
          onUpDateParameter(res)
        }).finally(() => {
          setSearchQuer((v) => ({ ...v, querying: false }))
        })
    } else {
      fetch(searchUrl, { ...FETCH_INIT, body: JSON.stringify(bodyQuer) })
        .then(res => res.text())
        .then(res => JSON.parse(res))
        .then(res => {
          if (res.data?.err_code || res.data?.error_code) {
            toast(ErrMessage(res.data?.err_code || res.data?.error_code, global.language, region), {
              autoClose: false,
            })
            return
          }
          onUpDateParameter(res)
        }).finally(() => {
          setSearchQuer((v) => ({ ...v, querying: false }))
        })
    }
  }

  // Translate search terms
  const onTranslateSearchTerms = () => {
    if (translateSearchTerms || !searchQuery.query) return;
    setTranslateSearchTerms(true)
    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Authorization", `Bearer ${apiKey}`);
    myHeaders.append("User-Agent", "Apifox/1.0.0 (https://apifox.com)");
    myHeaders.append("Content-Type", "application/json");
    const raw = JSON.stringify({
      "model": modelName,
      "message": `Translate the text into English for use as search keywords, return the result only, never explain: "${searchQuery.query}".`,
    });

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };
    fetch(import.meta.env.VITE_APP_AI_FETCH_URL, requestOptions)
      .then(response => response.text())
      .then(res => JSON.parse(res))
      .then((result: any) => {
        if (result?.error) {
          toast(ErrMessage(result?.error?.err_code || result?.error?.error_code, global.language, region), {
            autoClose: false,
          })
        }
        if (result?.output) {
          setSearchQuer((v) => ({ ...v, query: result.output.replace(/^['"]|['"]$/g, '') }))
        }
      })
      .catch(error => console.log('error', error))
      .finally(() => { setTranslateSearchTerms(false) })
  }

  // Search bar layout
  const onSearchCom = () => {
    const onKeyDown = (e: { key: string }) => {
      const dom = window.document.getElementById("query-button")
      if (e?.key === "Enter" && dom) dom.click()
    }
    const onChange = (e: { target: { value: any; }; }) => {
      setSearchQuer((v) => ({ ...v, query: e.target.value }))
    }

    return (
      <>
        <div className="relative w-full">
          <Input onKeyDown={onKeyDown} className={`w-full ${translateSearchTerms ? 'pr-20' : 'pr-12'}`} id="query-input" disabled={searchQuery.querying} value={searchQuery.query} onChange={onChange} placeholder={t("search.placeholder")} />
          {
            <div className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer " style={{ color: '#6b6b6b' }}>
              {/* 翻译 */}
              <Tooltip content={t("button.tips")}>
                <div style={{ width: translateSearchTerms ? 71 : 50, height: '100%', padding: '5px 10px', borderTopRightRadius: 5, borderBottomRightRadius: 5 }} className="hover:bg-slate-300 flex items-center" onClick={() => { onTranslateSearchTerms() }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                    <path d="M152.1 236.2c-3.5-12.1-7.8-33.2-7.8-33.2h-.5s-4.3 21.1-7.8 33.2l-11.1 37.5H163zM616 96H336v320h280c13.3 0 24-10.7 24-24V120c0-13.3-10.7-24-24-24zm-24 120c0 6.6-5.4 12-12 12h-11.4c-6.9 23.6-21.7 47.4-42.7 69.9 8.4 6.4 17.1 12.5 26.1 18 5.5 3.4 7.3 10.5 4.1 16.2l-7.9 13.9c-3.4 5.9-10.9 7.8-16.7 4.3-12.6-7.8-24.5-16.1-35.4-24.9-10.9 8.7-22.7 17.1-35.4 24.9-5.8 3.5-13.3 1.6-16.7-4.3l-7.9-13.9c-3.2-5.6-1.4-12.8 4.2-16.2 9.3-5.7 18-11.7 26.1-18-7.9-8.4-14.9-17-21-25.7-4-5.7-2.2-13.6 3.7-17.1l6.5-3.9 7.3-4.3c5.4-3.2 12.4-1.7 16 3.4 5 7 10.8 14 17.4 20.9 13.5-14.2 23.8-28.9 30-43.2H412c-6.6 0-12-5.4-12-12v-16c0-6.6 5.4-12 12-12h64v-16c0-6.6 5.4-12 12-12h16c6.6 0 12 5.4 12 12v16h64c6.6 0 12 5.4 12 12zM0 120v272c0 13.3 10.7 24 24 24h280V96H24c-13.3 0-24 10.7-24 24zm58.9 216.1L116.4 167c1.7-4.9 6.2-8.1 11.4-8.1h32.5c5.1 0 9.7 3.3 11.4 8.1l57.5 169.1c2.6 7.8-3.1 15.9-11.4 15.9h-22.9a12 12 0 0 1 -11.5-8.6l-9.4-31.9h-60.2l-9.1 31.8c-1.5 5.1-6.2 8.7-11.5 8.7H70.3c-8.2 0-14-8.1-11.4-15.9z" />
                  </svg>
                  {translateSearchTerms && <Spinner className="ml-3" />}
                </div>
              </Tooltip>
            </div>
          }
        </div>
        <div>
          <PopoverDemo />
        </div>
        <Button id="query-button" onClick={() => getArxiv()} disabled={searchQuery.querying || !searchQuery.query || translateSearchTerms}>
          {searchQuery.querying ? <Spinner /> :
            <svg width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" ></path>
            </svg>}
        </Button>
      </>
    )
  }

  // Computer List Layout
  const onDesktopPage = () => {
    return (
      <>
        <div className="flex text-center font-bold" style={{ borderBottom: "0.8px solid rgb(235, 238, 245)", backgroundColor: "#f5f7fa", color: "#909399" }}>
          <div className="p-2 text-sm" style={{ flex: "3", borderRight: "0.8px solid rgb(235, 238, 245)" }}>{t("table.patent_title")}</div>
          <div className="p-2 text-sm" style={{ flex: "2", borderRight: "0.8px solid rgb(235, 238, 245)" }}>{t("table.author_assignee")}</div>
          <div className="p-2 text-sm w-36" style={{ borderRight: "0.8px solid rgb(235, 238, 245)" }}>{t("table.application_date")}</div>
          <div className="p-2 text-sm w-32">{t("table.action")}</div>
        </div>
        <div className="h-full flex-1">
          {
            dataSource.list?.length ? (
              dataSource.list.map((item) =>
                <div key={item.patent_id} className="flex" style={{ borderBottom: "0.8px solid rgb(235, 238, 245)" }}>
                  <div className="p-3 text-sm flex flex-col gap-1" style={{ flex: "3", borderRight: "0.8px solid rgb(235, 238, 245)" }}>
                    <div className="text-slate-500 text-xs origin-left scale-90">{item.publication_number}</div>
                    <div>{item.title}</div>
                    {item.language !== global.language ? <div className="font-bold">[ {item?.translated_title || item?.translate_title} ]</div> : <></>}
                  </div>
                  <div className="p-3 text-xs flex justify-center items-center text-center" style={{ flex: "2", borderRight: "0.8px solid rgb(235, 238, 245)" }}>{item.inventor} <br /> {item.assignee}</div>
                  <div className="p-3 text-xs flex justify-center items-center w-36" style={{ borderRight: "0.8px solid rgb(235, 238, 245)" }}>{item.filing_date}</div>
                  <div className="p-3 text-xs flex justify-center items-center w-32">
                    <DocumentDialog document={item} languageType={language} />
                  </div>
                </div>
              )
            ) : <div className="flex justify-center items-center font-bold  noContent" style={{ color: "#909399", minHeight: 'calc(100vh - 406px)' }}>{t("table.no_content")}</div>
          }
        </div>
      </>
    )
  }

  // Mobile List Layout
  const onMobilePage = () => {
    return (
      <>
        <div className="flex text-center font-bold" style={{ borderBottom: "0.8px solid rgb(235, 238, 245)", backgroundColor: "#f5f7fa", color: "#909399" }}>
          <div className="p-2 text-sm" style={{ flex: "1", borderRight: "0.8px solid rgb(235, 238, 245)" }}>{t("table.patent_information")}</div>
          <div className="p-2 text-sm w-16">{t("table.action")}</div>
        </div>
        <div className={cn("flex-1", dataSource.list?.length ? "" : "flex justify-center items-center font-bold")}>
          {
            dataSource.list?.length ? (
              dataSource.list.map((item) =>
                <div key={item.patent_id} className="flex" style={{ borderBottom: "0.8px solid rgb(235, 238, 245)" }}>
                  <div className="p-1 text-xs flex flex-col gap-1" style={{ flex: "1", borderRight: "0.8px solid rgb(235, 238, 245)" }}>
                    <div className="py-1 px-2 font-medium" style={{ backgroundColor: "#edf2fe", color: "#002bb7c5" }}>
                      <div className="text-slate-500 text-xs origin-left scale-90">{item.publication_number}</div>
                      <div>{t("table.title")} : {item.title}</div>
                      {

                        item.language !== global.language ? <div className="font-bold">[ {item?.translated_title || item?.translate_title} ]</div> : <></>
                      }
                    </div>
                    <div className="py-1 px-2 font-medium" style={{ backgroundColor: "#def7f9", color: "#0e7c98" }}>{t("table:author")}: {item.inventor}</div>
                    <div className="py-1 px-2 font-medium" style={{ backgroundColor: "#def7f9", color: "#0e7c98" }}>{t("table.assignee")} : {item.assignee}</div>
                    <div className="py-1 px-2 font-medium" style={{ backgroundColor: "#ffefd6", color: "#cc4e00" }}>{t("table.application_date")} : {item.filing_date}</div>
                  </div>
                  <div className="flex justify-center items-center w-16">
                    <DocumentDialog languageType={language} document={item} />
                  </div>
                </div>
              )
            ) : <div className="flex justify-center items-center font-bold" style={{ color: "#909399", minHeight: 'calc(100vh - 324px)' }}>{t("table.no_content")}</div>
          }
        </div>
      </>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 flex flex-col overflow-y-auto " style={{ backgroundColor: "#f5f5f5" }}>
      <Header />
      <div className="flex flex-col justify-between h-full">
        <div className="main-container w-full lg:p-6 p-3 flex flex-col relative" style={{ margin: '0 auto' }}>
          <div >
            <div className='flex absolute right-10 top-2'><LanguagePopover /></div>
          </div>
          <div>
            <div className="font-bold w-48 mb-1">{t("search.topic")}</div>
            {/* Search bar */}
            <div className="flex items-center gap-2">{onSearchCom()}</div>
            {/* list */}
            <div className="lg:mt-4 mt-2 flex-1 flex flex-col">
              <div className="font-bold w-48 mb-1">{t("search.results")} {dataSource.total_results ? "(" + dataSource.total_results + ")" : ""}</div>
              {/* Computer end */}
              <div className={`${dataSource.list?.length ? '' : 'flex-1'} flex flex-col desktop-data-list`} style={{ border: "0.8px solid rgb(235, 238, 245)" }}>
                {onDesktopPage()}
              </div>
              {/* Mobile end */}
              <div className={`${dataSource.list?.length ? '' : 'flex-1'} flex flex-col mobile-data-list`} style={{ border: "0.8px solid rgb(235, 238, 245)" }}>
                {onMobilePage()}
              </div>
              {/* Paging component */}
              {
                dataSource.list?.length ? <div className="flex justify-center gap-2 mt-3">
                  <div
                    className={cn("pagenation", (searchQuery.currentPage === 1 || searchQuery.querying) ? "cursor-not-allowed" : "cursor-pointer")}
                    style={{ backgroundColor: (searchQuery.currentPage === 1 || searchQuery.querying) ? "#f5f7fa" : "" }}
                    onClick={() => searchQuery.currentPage !== 1 && !searchQuery.querying && getArxiv(searchQuery.currentPage - 1)}
                  >
                    <svg width="17.5" height="17.5" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill={(searchQuery.currentPage === 1 || searchQuery.querying) ? "#a8abb2" : "currentColor"} fillRule="evenodd" clipRule="evenodd" d="M8.81809 4.18179C8.99383 4.35753 8.99383 4.64245 8.81809 4.81819L6.13629 7.49999L8.81809 10.1818C8.99383 10.3575 8.99383 10.6424 8.81809 10.8182C8.64236 10.9939 8.35743 10.9939 8.1817 10.8182L5.1817 7.81819C5.09731 7.73379 5.0499 7.61933 5.0499 7.49999C5.0499 7.38064 5.09731 7.26618 5.1817 7.18179L8.1817 4.18179C8.35743 4.00605 8.64236 4.00605 8.81809 4.18179Z"></path>
                    </svg>
                  </div>
                  <div className="pagenation text-sm gap-2" style={{ width: 60 }}>{searchQuery.querying && <Spinner />}{searchQuery.currentPage}</div>
                  <div
                    className={cn("pagenation", (!dataSource.next_page || searchQuery.querying) ? "cursor-not-allowed" : "cursor-pointer")}
                    onClick={() => dataSource.next_page && !searchQuery.querying && getArxiv(searchQuery.currentPage + 1)}
                  >
                    <svg width="17.5" height="17.5" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill={(!dataSource.next_page || searchQuery.querying) ? "#a8abb2" : "currentColor"} fillRule="evenodd" clipRule="evenodd" d="M6.18194 4.18185C6.35767 4.00611 6.6426 4.00611 6.81833 4.18185L9.81833 7.18185C9.90272 7.26624 9.95013 7.3807 9.95013 7.50005C9.95013 7.6194 9.90272 7.73386 9.81833 7.81825L6.81833 10.8182C6.6426 10.994 6.35767 10.994 6.18194 10.8182C6.0062 10.6425 6.0062 10.3576 6.18194 10.1819L8.86374 7.50005L6.18194 4.81825C6.0062 4.64251 6.0062 4.35759 6.18194 4.18185Z"></path>
                    </svg>
                  </div>
                </div> : <></>
              }
            </div>
          </div>
        </div>
        {showBrand && <PoweredBy />}
      </div>
    </div>
  )
}

export default App
