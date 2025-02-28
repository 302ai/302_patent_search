import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Textarea } from ".";
import { useEffect, useMemo, useState } from "react";
import { Progress, Spinner } from "@radix-ui/themes";
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { toast } from "react-toastify";
import { ErrMessage } from "./ErrMessage";
import { cn, isValidJSONObject } from "../utils";
import { selectGlobal } from "../store/globalSlice";
import { useAppSelector } from "../store/hooks";
import { marked } from "marked"
import Loading from "./ui/loading";
import { isMobile } from "react-device-detect";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, } from "../components/ui/pagination"
import ImageViewer from 'eco-react-image-viewer';
import { IPatentList } from "../interface";
import { useTranslation } from "react-i18next";
import { addData, IAIPatentRecordList } from "./HistoricalRecords/indexedDB";
import { FaEye } from "react-icons/fa";
import dayjs from "dayjs";

const headers = {
  "accept": "application/json",
  "Content-Type": "application/json"
}

const enterStyles: React.CSSProperties = {
  wordWrap: 'break-word',
  overflowWrap: 'break-word',
  wordBreak: 'break-all',
}

export const languageList = [
  { label: '中文(中文)', value: 'Chinese', code: 'zh' },
  { label: '英语(English)', value: 'English', code: 'en' },
  { label: '日语(日本語)', value: 'Japanese', code: 'ja' },
  { label: '德语(Deutsch)', value: 'German', code: 'de' },
  { label: '法语(Français)', value: 'French', code: 'fr' },
  { label: '韩语(한국어)', value: 'Korean', code: 'ko' },
]

interface IProps { document: IPatentList, languageType: string, isRecord?: boolean, recordData?: IAIPatentRecordList }

export default function DocumentDialog({ document, languageType, isRecord, recordData }: IProps) {

  const { t } = useTranslation();
  const [desktopActiveTab, setDesktopActiveTab] = useState("details")
  const global = useAppSelector(selectGlobal)

  const modelName = import.meta.env.VITE_APP_MODEL_NAME;
  const apiKey = import.meta.env.VITE_APP_API_KEY;
  const region = import.meta.env.VITE_APP_REGION;
  const SSE_CHAT_URL = import.meta.env.VITE_APP_SSE_CHAT_URL;
  const INTERPRET_URL = import.meta.env.VITE_APP_INTERPRET_URL;
  const LATEX_TRANSLATE_URL = import.meta.env.VITE_APP_LATEX_TRANSLATE_URL;
  const TASKS_URL = import.meta.env.VITE_APP_TASKS_URL;
  const TRANSLATION_URL = import.meta.env.VITE_APP_TRANSLATION_URL
  const PC_READ_PDF_URL = import.meta.env.VITE_APP_PC_READ_PDF_URL;

  // put questions to
  const [queryWidth, setQueryWidth] = useState<string | undefined>(undefined)
  const [language, setLanguage] = useState(languageType)
  const [parseTaskId, setParseTaskId] = useState("")
  const [query, setQuery] = useState("")
  const [querying, setQuerying] = useState(false)
  const [queryInfo, setQueryInfo] = useState<{
    history: string[],
    progress: number
  } | undefined>(undefined)
  async function queryPaper() {
    const historyTemp = queryInfo?.history || []
    setQueryInfo({
      history: [...historyTemp, "query-user_say-" + query],
      progress: 100
    })
    toScrollBottom("answer")
    setQuery("")
    setQuerying(true)
    fetch(SSE_CHAT_URL, {
      method: "post",
      headers,
      body: JSON.stringify({
        task_id: parseTaskId,
        query,
        language: global.language,
        api_key: apiKey,
        models_name: modelName,
      })
    }).then((response) => {
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        readStream(reader, "")
      }
      function readStream(reader: ReadableStreamDefaultReader<Uint8Array>, answer: string): Promise<ReadableStreamDefaultReader<Uint8Array> | undefined> {
        if (answer) setQuerying(false)
        return reader.read().then(({ value }) => {
          const chunk = new TextDecoder('utf-8').decode(value);
          if (chunk.indexOf("Error") > -1) {
            const chunkArr = chunk.replace("Error:", "").replace("data:", "").replace("{", "").replace("}", "").trimStart().trimEnd().split(",")
            chunkArr.forEach(chunk => {
              if (chunk.indexOf("err_code") > -1) {
                setParseErr(ErrMessage(+chunk.split(":")[1], global.language, region))
                toScrollBottom("answer")
              }
            })
            setQuerying(false)
            return
          }
          if (chunk.indexOf("[DONE]") > -1) {
            const splitAnswer = answer.split("\\n")
            const splitAnswerMarked = splitAnswer.map(str => {
              if (str) return marked.parse(str)
              else return ""
            })
            setQueryInfo({
              history: [...historyTemp, "query-user_say-" + query, "query-gpt_say-" + splitAnswerMarked.join("")],
              progress: 100
            })
            setQuerying(false)
            return
          }
          const chunkList = chunk.split("\n").filter(chunk => chunk).map(chunk => chunk.replace("data:", "").trimStart().trimEnd().replace(/'/g, '"'))
          chunkList.forEach(chunk => {
            if (!chunk || !isValidJSONObject(chunk)) return;
            const chunkJSON = JSON.parse(chunk)
            chunkJSON?.choices.forEach((choice: {
              delta: {
                content: string
              }
            }) => {
              const content = choice?.delta?.content
              if (content) {
                answer += content
                const splitAnswer = answer.split("\\n")
                const splitAnswerMarked = splitAnswer.map(str => {
                  if (str) return marked.parse(str)
                  else return ""
                })
                setQueryInfo({
                  history: [...historyTemp, "query-user_say-" + query, "query-gpt_say-" + splitAnswerMarked.join("")],
                  progress: 100
                })
                toScrollBottom("answer")
              }
            })
          })
          return readStream(reader, answer);
        });
      }
    })
  }
  // Analyzing patents
  const [parsedPaper, setParsedPaper] = useState(false)
  const [parsingPaper, setParsingPaper] = useState(false)
  async function parsePaper() {
    setParsingPaper(true)
    fetch(INTERPRET_URL, {
      method: "post",
      headers,
      body: JSON.stringify({
        data_cid: document.patent_id,
        pdf_url: document.pdf,
        language: global.language,
        api_key: apiKey,
        models_name: modelName,
        use_cache: true
      })
    }).then(res => res.text())
      .then(res => JSON.parse(res))
      .then(res => {
        if (res.data.err_code) {
          toast.error(res.data.err_code)
          setParsingPaper(false)
          return
        }
        const dom = window.document.getElementById("tab-content")
        if (dom) {
          const domWidth = dom.offsetWidth
          setQueryWidth((domWidth - 80) + "px")
        }
        if (res.data?.cache_data?.history?.length) {
          setQueryInfo({
            history: res.data.cache_data.history.filter((history: string) => history.indexOf("user_say") === -1),
            progress: res.data.cache_data.progress
          })
          setParseTaskId(res.data.task_id)
          setParsingPaper(false)
          setParsedPaper(true)
          toScrollBottom("answer")
        }
        else getTaskInfo(res.data.task_id, "parse")
      })
  }

  // Full text translation
  const [translatePdfUrl, setTranslatePdfUrl] = useState("")
  const [fullTextTranslation, setFullTextTranslation] = useState<{
    history: string[],
    progress: number
  } | undefined>(undefined)
  const [translateErr, setTranslateErr] = useState<React.ReactNode | undefined>(undefined)
  const [translating, setTranslating] = useState(false)
  const [translateWidth, setTranslateWidth] = useState<string | undefined>(undefined)
  async function getTranslate() {
    setTranslating(true)
    fetch(LATEX_TRANSLATE_URL, {
      method: "post",
      headers,
      body: JSON.stringify({
        data_cid: document.patent_id,
        pdf_url: document.pdf,
        language,
        api_key: apiKey,
        models_name: modelName,
        use_cache: true,
        ori_title: document.title,
        translated_title: document?.translated_title || document?.translate_title
      })
    }).then(res => res.text())
      .then(res => JSON.parse(res))
      .then(res => {
        if (res.data.err_code) {
          setTranslating(false)
          toast.error(res.data.err_code)
          return
        }
        const dom = window.document.getElementById("tab-content")
        if (dom) {
          const domWidth = dom.offsetWidth
          setTranslateWidth((domWidth - 40) + "px")
        }
        getTaskInfo(res.data.task_id, "translate")
      })
  }

  // Query Task
  const [taskIntervalId, setTaskInterval] = useState({
    summary: 0,
    translate: 0,
    query: 0,
    parse: 0
  })
  const [parseErr, setParseErr] = useState<React.ReactNode | undefined>(undefined)
  async function getTaskInfo(taskId: string, type: "summary" | "translate" | "query" | "parse") {
    if (taskIntervalId[type]) clearInterval(taskIntervalId[type])
    const taskIntervalIdTemp = taskIntervalId
    let intervalTime = 2000
    if (type === "parse" || type === "translate") intervalTime = 6000
    else if (type === "summary") intervalTime = 4000
    const intervalId = setInterval(() => {
      setTaskInterval({
        ...taskIntervalIdTemp,
        [type]: intervalId
      })
      fetch(TASKS_URL + taskId, {
        method: "get",
        headers
      }).then(res => res.text())
        .then(res => JSON.parse(res))
        .then(async res => {
          if (res.data.progress === -1) {
            if (type === "translate") {
              toast.error('翻译失败。。。')
              setTranslating(false)
            }
            else if (type === "parse") {
              toast.error('解析pdf失败。。。')
              setParsingPaper(false)
            }
            if (res.data.msg?.err_code) {
              if (type === "parse") setParseErr(ErrMessage(res.data.msg.err_code, global.language, region))
              else if (type === "translate") setTranslateErr(ErrMessage(res.data.msg.err_code, global.language, region))
            }
            if (type === "translate") {
              if (res.data.msg?.err_code) setTranslateErr(ErrMessage(res.data.msg.err_code, global.language, region))
              else setFullTextTranslation({
                history: res.data.history,
                progress: res.data.progress || 0
              })
            }
            clearInterval(intervalId)
            return
          }
          const data = {
            history: res.data.history,
            progress: res.data.progress || 0
          }
          if (type === "translate") {
            setFullTextTranslation(data)
            for (let i = res.data.history.length - 1; i >= 0; i--) {
              if (res.data.history[i].indexOf("merge_translate_zh_pdf_url-") > -1) {
                const pdfUrl = res.data.history[i].split("merge_translate_zh_pdf_url-")[1]
                setTranslatePdfUrl(pdfUrl)
                await addData({
                  type: 'translate',
                  title: document.title,
                  language,
                  translateFiel: {
                    url: pdfUrl,
                    language,
                  },
                  created_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
                })
                break
              }
            }
          }
          else if (type === "parse") {
            setQueryInfo({
              ...data,
              history: res.data.history.filter((history: string) => history.indexOf("user_say") === -1)
            })
          }
          if (res.data.progress === 100) {
            if (type === "translate") setTranslating(false)
            else if (type === "parse") {
              setParseTaskId(taskId)
              setParsedPaper(true)
              setParsingPaper(false)
            }
            clearInterval(intervalId)
          }
          toScrollBottom(type)
        })
    }, intervalTime)
  }

  // Translation Summary
  const [translationSummaryText, setTranslationSummaryText] = useState('');
  const [actionTranslationSummary, setActionTranslationSummaryText] = useState(false);
  const onTranslationSummary = () => {
    if (actionTranslationSummary) return
    setActionTranslationSummaryText(true);
    const language = global.language.charAt(0).toUpperCase() + global.language.slice(1)
    fetch(TRANSLATION_URL, {
      method: "post",
      headers,
      body: JSON.stringify({
        language,
        original: document.snippet,
        api_key: apiKey,
        models_name: modelName,
      })
    }).then(res => res.text())
      .then(res => JSON.parse(res))
      .then(async res => {
        if (res?.data?.msg?.err_code) {
          toast(ErrMessage(res?.data?.msg?.err_code, global.language, region), {
            autoClose: false,
          })
          return
        }
        setTranslationSummaryText(res?.data?.translation || '')
        await addData({
          type: 'summary',
          title: document.title,
          language,
          abstract: {
            item: document,
            translationSummaryText: res?.data?.translation || ''
          },
          created_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
        })
      }).finally(() => {
        setActionTranslationSummaryText(false);
      })
  }

  useEffect(() => {
    setHeight()
  }, [fullTextTranslation])

  useEffect(() => {
    toScrollBottom("answer", "instant")
    toScrollBottom("summary", "instant")
    toScrollBottom("translate", "instant")
  }, [desktopActiveTab])

  function setHeight() {
    const contentHiehgt = window.innerHeight * 0.9 - 48.5
    const summaryDom = window.document.getElementById("summary")
    const translateDom = window.document.getElementById("translate")
    if (summaryDom) summaryDom.style.height = (contentHiehgt - 8 - 48) + "px"
    if (translateDom) translateDom.style.height = (contentHiehgt - 8 - 48) + "px"
  }

  function toScrollBottom(id: string, behavior: "smooth" | "instant" = "smooth") {
    setTimeout(() => {
      const domId = (id === "parse" ? "answer" : id)
      const desktopDom = window.document.getElementById(domId)
      let mobileDom = window.document.getElementById(domId + "-mobile")
      if (domId !== "answer") mobileDom = mobileDom?.parentElement || null
      desktopDom?.scrollBy({
        top: 99999,
        behavior
      })
      mobileDom?.scrollBy({
        top: 99999,
        behavior
      })
    })
  }
  const [loading, setLoading] = useState(true);

  const onRenderingPdf = () => {
    const src = isMobile ? document.pdf : `${PC_READ_PDF_URL}?url=${document.pdf}`;
    return (
      <>
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 999,
            fontSize: '20px',
            color: '#555'
          }}>
            <Loading type="spinner" />
          </div>
        )}
        {<iframe src={document?.pdf ? src : ''} className="w-full h-full" onLoad={() => setLoading(false)} />}
      </>
    )
  }

  const [sonTab, setSonTab] = useState('image')
  const [mobileTab, setmobileTab] = useState('result')
  // Paging processing
  const [currentPage, setCurrentPage] = useState(1);
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const getVisiblePages = () => {
    const startPage = Math.max(1, currentPage - 1);
    const totalPages = Math.ceil(document.figures?.length / 10);
    const endPage = Math.min(totalPages, startPage + 2);
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Render paginator
  const onRendering = () => {
    const totalPages = Math.ceil(document.figures?.length / 10);
    return (
      <Pagination className="pagination">
        <PaginationContent className="pl-0">
          <PaginationItem>
            <PaginationPrevious href="#" onClick={() => handlePageChange(Math.max(1, currentPage - 1))} >
              {t("previous_page")}
            </PaginationPrevious>
          </PaginationItem>
          {getVisiblePages().map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive
                onClick={() => handlePageChange(page)}
                className={`hover:bg-blue-500 hover:text-white ${page === currentPage ? 'bg-blue-500 text-white' : ''}`}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href="#" onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} >
              {t("next_page")}
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  // Rendering PDF and A tags on mobile devices
  const onMobilePdf = () => {
    if (isMobile) {
      return (
        <a
          target="_blank"
          href={document.pdf}
          style={{ backgroundColor: "#eff3f2", color: "#0070f0" }}
          className="flex justify-center items-center font-bold h-full"
        >
          {t("open_pdf")}
        </a>
      )
    } else {
      return (onRenderingPdf())
    }
  }

  // Rendering images
  const onRenderingImage = useMemo(() => {
    const imgs = document.figures.filter((_, index) => {
      if (currentPage === 1) {
        return index < 10;
      } else {
        return index <= currentPage * 10 && index > (currentPage - 1) * 10
      }
    })
    return (
      imgs.map((item, index) =>
        <img src={item.full} key={item.full} className={`rounded-md ${index + 1 !== imgs.length ? 'md:mb-5 mb-3' : ''} w-full`} onClick={() => { setImageVieweVisible(true); setImageVieweIndex(index) }} />
      )
    )
  }, [currentPage]);

  // picture viewer 
  const [imageVieweVisible, setImageVieweVisible] = useState(false)
  const [imageVieweIndex, setImageVieweIndex] = useState(0)

  const copyText = (text: string) => {
    return navigator.clipboard.writeText(text).then(() => {
      toast.success(t('copy_suc'))
      return true;
    }).catch(() => {
      toast.error(t('copy_error'))
    });
  }

  return <Dialog onOpenChange={(value) => {
    if (!value) {
      if (taskIntervalId.parse) {
        clearInterval(taskIntervalId.parse)
        if (queryInfo?.progress !== 100) {
          setQueryInfo(undefined)
          setParsingPaper(false)
        }
      }
      if (taskIntervalId.translate) {
        clearInterval(taskIntervalId.translate)
        if (fullTextTranslation?.progress !== 100) {
          setFullTextTranslation(undefined)
          setTranslating(false)
        }
      }
    } else if (recordData && recordData.abstract) {
      setTranslationSummaryText(recordData.abstract.translationSummaryText)
    } else {
      toScrollBottom("answer", "instant")
      toScrollBottom("summary", "instant")
      toScrollBottom("translate", "instant")
    }
  }}>
    <DialogTrigger>
      {
        isRecord ? <Button variant="ghost" className="p-0 m-0 hover:bg-transparent"><FaEye /></Button> :
          <Button variant="secondary" size="sm" onClick={() => {
            setTimeout(() => {
              setHeight()
              setLoading(true)
            })
          }}>{t("open")}</Button>
      }
    </DialogTrigger>
    <DialogContent hidden={true} className="p-0 flex flex-col" style={{ maxWidth: 2560, margin: '0 auto', backgroundColor: '#f3f3f3' }}>
      {/* Computer end */}
      <div className="dialog-desktop-data-list" style={{ backgroundColor: '#f9f9f9' }}>
        <div className="md:text-lg text-sm font-bold py-1 text-center px-9" style={{ borderBottom: "1px solid #e0e0e0" }}>
          {document?.translated_title || document?.translate_title || document?.title}
        </div>
        <div className="p-5 ">
          <div className="flex pb-5 justify-center">
            <div className="flex font-bold md:text-base text-sm justify-center" style={{ backgroundColor: '#e7eeff8f', borderRadius: 10, }}>
              <div onClick={() => setDesktopActiveTab("details")} className="px-10 py-1 text-center cursor-pointer border-2 border-solid rounded-lg" style={{ backgroundColor: desktopActiveTab === "details" ? "#fff" : '', borderColor: desktopActiveTab === "details" ? "#000" : "#e7eeff8f", color: desktopActiveTab === "details" ? "#000" : "#8c8f95" }}>{t("patent_details")}</div>
              <div onClick={() => setDesktopActiveTab("translate")} className="px-10 py-1 text-center cursor-pointer border-2 border-solid rounded-lg" style={{ backgroundColor: desktopActiveTab === "translate" ? "#fff" : '', borderColor: desktopActiveTab === "translate" ? "#000" : "#e7eeff8f", color: desktopActiveTab === "translate" ? "#000" : "#8c8f95" }}>{t("full_text_translation")}</div>
              <div onClick={() => setDesktopActiveTab("query")} className="px-10 py-1 text-center cursor-pointer border-2 border-solid rounded-lg" style={{ backgroundColor: desktopActiveTab === "query" ? "#fff" : '', borderColor: desktopActiveTab === "query" ? "#000" : "#e7eeff8f", color: desktopActiveTab === "query" ? "#000" : "#8c8f95" }}>{t("ai_qa")}</div>
            </div>
          </div>
          <div className="flex">
            <div style={{ width: '50%', maxWidth: 1240 }}>
              <div className="flex mb-5" style={{ borderBottom: '1px solid #e0e0e0', display: (desktopActiveTab === "details" && document?.figures.length) ? "flex" : "none" }}>
                <div onClick={() => setSonTab("image")} className="w-28 text-center cursor-pointer" style={{ padding: "2.5px", borderBottom: sonTab === "image" ? "2px solid #296d4d" : "1px solid #f0f0f3", color: sonTab === "image" ? "#296d4d" : "#383838" }}>{t("patent_image")}</div>
                <div onClick={() => setSonTab("pdf")} className="w-28 text-center cursor-pointer" style={{ padding: "2.5px", borderBottom: sonTab === "pdf" ? "2px solid #296d4d" : "1px solid #f0f0f3", color: sonTab === "pdf" ? "#296d4d" : "#383838" }}>{t("pdf_file")}</div>
              </div>
              <div
                className="flex flex-col rounded-md overflow-y-auto relative"
                style={{ border: '1px solid #e0e0e0', height: (desktopActiveTab === 'details' && document.figures.length) ? `calc(100vh - ${(sonTab === 'image') ? '349' : '281'}px)` : 'calc(100vh - 229px)' }}
              >
                <div style={{ display: document.figures.length && desktopActiveTab === 'details' && sonTab === 'image' ? "" : "none" }}>
                  {onRenderingImage}
                </div>
                <div className="h-full" style={{ display: (desktopActiveTab === 'details' && sonTab === 'pdf') || !document.figures.length || desktopActiveTab !== 'details' ? "" : "none" }}>
                  {onRenderingPdf()}
                </div>
              </div>
              <div style={{ display: document.figures.length && desktopActiveTab === 'details' && sonTab === 'image' ? "" : "none" }}>
                {onRendering()}
              </div>
            </div>

            <div style={{ width: 20 }}></div>

            <div className="rounded-md" style={{ border: '1px solid #e0e0e0', overflow: 'hidden', width: '50%', height: 'calc(100vh - 229px)', maxWidth: 1240, backgroundColor: '#fff' }}>
              {/* Details page */}
              <div className="flex-1 flex-col h-full overflow-y-auto" style={{ display: desktopActiveTab === "details" ? "flex" : "none" }}>
                <div className="flex-1 p-4 text-sm mb-2 relative overflow-y-auto" style={{ color: "#282c2b" }}>
                  <div className="font-bold text-base ">{t("table.title")} :&ensp;<span className="text-slate-700 text-sm">{document.title}</span></div>
                  <div className="font-bold text-base ">{t("table:author")} :&ensp;<span className="text-slate-700 text-sm">{document.inventor}</span></div>
                  <div className="font-bold text-base ">{t("privilege_day")} :&ensp;<span className="text-slate-700 text-sm">{document.filing_date}</span></div>
                  <div className="font-bold text-base ">{t("table.application_date")} :&ensp;<span className="text-slate-700 text-sm">{document.grant_date}</span></div>
                  <div className="font-bold text-base ">{t("publication_date")} :&ensp;<span className="text-slate-700 text-sm">{document.publication_date}</span></div>
                  <div className="font-bold text-base ">{t("original_text_summary")} :&ensp;<span className="text-slate-700 text-sm">{document.snippet}</span></div>
                  {
                    translationSummaryText ?
                      <div>
                        <div className="font-semibold my-2">{t("translation_summary_result")}：</div>
                        <span className="text-orange-950">{translationSummaryText}</span>
                      </div>
                      : <></>
                  }
                  {
                    !translationSummaryText && document.language !== global.language ?
                      <div className="mt-4 flex">
                        <Theme onClick={onTranslationSummary}>
                          <Button style={{ backgroundColor: '#bfbfbf', color: '#000' }}>
                            {t("translation_summary")}
                            {actionTranslationSummary && <Spinner className="ml-2" />}
                          </Button>
                        </Theme>
                      </div> : <></>
                  }
                </div>
              </div>

              {/* Translation page */}
              <div className="flex-1 flex-col h-full  overflow-y-auto" style={{ display: desktopActiveTab === "translate" ? "flex" : "none" }}>
                {!translatePdfUrl ?
                  <div className="flex-1 text-sm relative overflow-y-auto" style={{ backgroundColor: "#fff", color: "#282c2b" }}>
                    {(fullTextTranslation || translating || translateErr) ?
                      <div className="text-base p-2 pt-1 overflow-y-auto flex items-center justify-center flex-col h-full">
                        {
                          translating ?
                            <>
                              <Loading type="sk-circle" />
                              <Theme className="w-2/4">
                                <Progress value={fullTextTranslation?.progress || 0} size="3" />
                              </Theme>
                            </>
                            : <></>
                        }
                        {
                          <div style={{ ...enterStyles, color: '#8f8f8f', fontSize: 12, width: translateWidth ? translateWidth : undefined }} >
                            {
                              fullTextTranslation?.history.length ?
                                fullTextTranslation.history[fullTextTranslation.history.length - 1].replace("user_say-", "").replace("gpt_say-", "")
                                : t("translation_in_progress")
                            }
                          </div>
                        }
                        {
                          translateErr &&
                          <div className="my-1 p-2 flex gap-2" style={{ ...enterStyles, backgroundColor: "#ffe9f0", border: "0.8px solid #ffe9f0", color: "#d13372" }}>
                            {translateErr}
                            <div> {t("or")} <span className="underline cursor-pointer" onClick={() => {
                              setFullTextTranslation(undefined)
                              setTranslateErr(undefined)
                              getTranslate()
                            }} style={{ color: "rgb(0, 112, 240)" }}>{t("retry_to_generate")}</span></div>
                          </div>
                        }
                      </div> :
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] text-center">
                        <Select value={language} onValueChange={(value: string) => { setLanguage(value) }}>
                          <SelectTrigger>
                            <SelectValue placeholder={<span className="text-muted-foreground">{t("selecet_lang")}</span>} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {languageList.map((item => <SelectItem className="cursor-pointer" key={item.value} value={item.value}>{item.label}</SelectItem>))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <Button className="w-[60%] mt-5" size="lg" onClick={() => getTranslate()}>{t("start_translation")}</Button>
                      </div>
                    }
                  </div> :
                  <iframe src={translatePdfUrl + "#navpanes=0&toolbar=1"} height="100%" />
                }
              </div>

              {/* AI Q&A */}
              <div className="flex-1 flex-col  relative " style={{ display: desktopActiveTab === "query" ? "flex" : "none" }}>
                <div className="text-sm" style={{ backgroundColor: "#fff", color: "#282c2b" }}>
                  <div id="answer" className="text-base overflow-y-auto p-2 pt-1 relative " style={{ height: 'calc(100vh - 314px)' }}>
                    {(!parsedPaper && !parsingPaper && parseErr === undefined) &&
                      <div onClick={parsePaper} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center cursor-pointer px-14 py-10 rounded-2xl" style={{ backgroundColor: "rgb(208 208 208 / 30%)" }}>
                        <svg width="55" height="55" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.900024 7.50002C0.900024 3.85495 3.85495 0.900024 7.50002 0.900024C11.1451 0.900024 14.1 3.85495 14.1 7.50002C14.1 11.1451 11.1451 14.1 7.50002 14.1C3.85495 14.1 0.900024 11.1451 0.900024 7.50002ZM7.50002 1.80002C4.35201 1.80002 1.80002 4.35201 1.80002 7.50002C1.80002 10.648 4.35201 13.2 7.50002 13.2C10.648 13.2 13.2 10.648 13.2 7.50002C13.2 4.35201 10.648 1.80002 7.50002 1.80002ZM3.07504 7.50002C3.07504 5.05617 5.05618 3.07502 7.50004 3.07502C9.94388 3.07502 11.925 5.05617 11.925 7.50002C11.925 9.94386 9.94388 11.925 7.50004 11.925C5.05618 11.925 3.07504 9.94386 3.07504 7.50002ZM7.50004 3.92502C5.52562 3.92502 3.92504 5.52561 3.92504 7.50002C3.92504 9.47442 5.52563 11.075 7.50004 11.075C9.47444 11.075 11.075 9.47442 11.075 7.50002C11.075 5.52561 9.47444 3.92502 7.50004 3.92502ZM7.50004 5.25002C6.2574 5.25002 5.25004 6.25739 5.25004 7.50002C5.25004 8.74266 6.2574 9.75002 7.50004 9.75002C8.74267 9.75002 9.75004 8.74266 9.75004 7.50002C9.75004 6.25738 8.74267 5.25002 7.50004 5.25002ZM6.05004 7.50002C6.05004 6.69921 6.69923 6.05002 7.50004 6.05002C8.30084 6.05002 8.95004 6.69921 8.95004 7.50002C8.95004 8.30083 8.30084 8.95002 7.50004 8.95002C6.69923 8.95002 6.05004 8.30083 6.05004 7.50002Z" fill="#8c8f95" fillRule="evenodd" clipRule="evenodd"></path></svg>
                        <div className=" text-lg font-bold text-center" style={{ color: "#8c8f95" }}>{t("ai_analysis")}</div>
                      </div>}
                    {queryInfo?.history.map((history, index) => <>
                      {
                        history.indexOf("query-user_say-") === -1 && <>
                          {
                            history.indexOf("err_code-") === -1 &&
                            <div key={index} className="flex items-start gap-2" style={{ width: queryWidth ? queryWidth : undefined }}>
                              <div
                                key={index}
                                className="my-1 p-2"
                                style={{ ...enterStyles, color: '#383838', backgroundColor: '#f0efff', border: "0.8px solid #f0efff", borderRadius: 8, maxWidth: '80%' }}
                                dangerouslySetInnerHTML={{ __html: history.replace("query-", "").replace("gpt_say-", "").replace("user_say-", "") }} />
                            </div>
                          }
                          {
                            history.indexOf("err_code-") > -1 && <>
                              <div key={index} className="flex items-start gap-2">
                                <img src="https://file.302.ai/gpt/imgs/5b36b96aaa052387fb3ccec2a063fe1e.png" width={30} height={30} className="object-contain mt-2" />
                                <div key={index} className="my-1 p-2" style={{ ...enterStyles, backgroundColor: '#f0efff', border: "0.8px solid #f0efff", color: "#383838", maxWidth: '80%' }}>
                                  {history.indexOf("-10001") > -1 && ErrMessage(-10001, global.language, region)}
                                  {history.indexOf("-10002") > -1 && ErrMessage(-10002, global.language, region)}
                                  {history.indexOf("-10003") > -1 && ErrMessage(-10003, global.language, region)}
                                  {history.indexOf("-10004") > -1 && ErrMessage(-10004, global.language, region)}
                                  {history.indexOf("-10005") > -1 && ErrMessage(-10005, global.language, region)}
                                  {history.indexOf("-10006") > -1 && ErrMessage(-10006, global.language, region)}
                                  {history.indexOf("-10007") > -1 && ErrMessage(-10007, global.language, region)}
                                  {history.indexOf("-10008") > -1 && ErrMessage(-10008, global.language, region)}
                                  {history.indexOf("-10009") > -1 && ErrMessage(-10009, global.language, region)}
                                  {history.indexOf("-10012") > -1 && ErrMessage(-10012, global.language, region)}
                                  {history.indexOf("-1024") > -1 && ErrMessage(-1024, global.language, region)}
                                </div>
                              </div>
                            </>
                          }
                        </>
                      }
                      {
                        history.indexOf("query-user_say-") > -1 &&
                        <div className="flex justify-end">
                          <div key={index} className="my-1 p-2 inline-block text-right" style={{ border: "0.8px solid #f5f5f5", backgroundColor: '#f5f5f5', borderRadius: 8, color: "#383838", maxWidth: '80%' }}>
                            {history.replace("query-user_say-", "")}
                          </div>
                        </div>
                      }
                    </>)}
                    {parsingPaper && <div className="flex items-start gap-2 text-left">
                      <Theme className="my-1 p-2 flex gap-2 items-center" style={{ ...enterStyles, backgroundColor: '#f0efff', border: "0.8px solid #f0efff", borderRadius: 8, maxWidth: '80%' }}>
                        <div style={{ color: "#383838" }}>{t("analyze_progress")} {queryInfo?.progress || 0} %</div>
                        <Spinner />
                      </Theme>
                    </div>}
                    {
                      parseErr && <div className="flex items-start gap-2">
                        <div className="my-1 p-2 flex gap-2 items-center cursor-pointer text-left" style={{ border: "0.8px solid #f0efff", backgroundColor: '#f0efff', borderRadius: 8, color: "#383838", maxWidth: '80%' }}>
                          {parseErr}
                          <div> {t("or")} <span onClick={() => {
                            setParseErr(undefined)
                            setQueryInfo(undefined)
                            parsePaper()
                          }} className="underline font-bold" style={{ color: "rgb(0, 112, 240)", backgroundColor: '#f0efff' }}>{t("reanalyze_ai")}</span></div>
                        </div>
                      </div>
                    }
                    {
                      querying && <div className="flex items-start gap-2">
                        <div className="my-1 p-2 w-20 flex justify-center" style={{ border: "0.8px solid #f0efff", backgroundColor: '#f0efff', borderRadius: 8 }}>
                          <div className="loader"></div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
                <div className="flex flex-1 px-5 w-full py-5">
                  <div className="relative w-full">
                    <Textarea onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const dom = window.document.getElementById('query-button-desktop');
                        if (dom) {
                          dom.click();
                        }
                      }
                    }} disabled={!parsedPaper || querying} value={query} onChange={(e) => { setQuery(e.target.value) }} className="bg-white h-11 pr-8" placeholder={t("questioning.tips")} />
                    <div
                      id="query-button-desktop"
                      className={`absolute right-2 top-1/2 ${!parsedPaper || !query ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={() => {
                        if (!parsedPaper || !query) return;
                        setParseErr(undefined);
                        queryPaper()
                      }}
                      style={{ backgroundColor: '#000', borderRadius: 50, padding: 8, transform: 'translateY(-50%) rotateZ(-45deg)' }}
                    >
                      <svg style={{ color: '#fff' }} width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.20308 1.04312C1.00481 0.954998 0.772341 1.0048 0.627577 1.16641C0.482813 1.32802 0.458794 1.56455 0.568117 1.75196L3.92115 7.50002L0.568117 13.2481C0.458794 13.4355 0.482813 13.672 0.627577 13.8336C0.772341 13.9952 1.00481 14.045 1.20308 13.9569L14.7031 7.95693C14.8836 7.87668 15 7.69762 15 7.50002C15 7.30243 14.8836 7.12337 14.7031 7.04312L1.20308 1.04312ZM4.84553 7.10002L2.21234 2.586L13.2689 7.50002L2.21234 12.414L4.84552 7.90002H9C9.22092 7.90002 9.4 7.72094 9.4 7.50002C9.4 7.27911 9.22092 7.10002 9 7.10002H4.84553Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile end */}
      <div className="dialog-mobile-data-list" style={{ backgroundColor: '#f9f9f9' }}>
        <div className="md:text-lg text-sm font-bold py-1 text-center px-5" style={{ borderBottom: "1px solid #e0e0e0" }}>
          {document?.translated_title || document?.translate_title || document?.title}
        </div>
        <div className="flex justify-center items-center pt-3 px-3">
          <div className="flex w-full font-bold md:text-base text-sm justify-center" style={{ backgroundColor: '#e7eeff8f', borderRadius: 10 }}>
            <div onClick={() => setDesktopActiveTab("details")} className="px-3 flex-1 py-1 text-center cursor-pointer border-2 border-solid rounded-lg" style={{ backgroundColor: desktopActiveTab === "details" ? "#fff" : '', borderColor: desktopActiveTab === "details" ? "#000" : "#e7eeff8f", color: desktopActiveTab === "details" ? "#000" : "#8c8f95" }}>{t("patent_details")}</div>
            <div onClick={() => setDesktopActiveTab("translate")} className="px-3 flex-1 py-1 text-center cursor-pointer border-2 border-solid rounded-lg" style={{ backgroundColor: desktopActiveTab === "translate" ? "#fff" : '', borderColor: desktopActiveTab === "translate" ? "#000" : "#e7eeff8f", color: desktopActiveTab === "translate" ? "#000" : "#8c8f95" }}>{t("full_text_translation")}</div>
            <div onClick={() => setDesktopActiveTab("query")} className="px-3 flex-1 py-1 text-center cursor-pointer border-2 border-solid rounded-lg" style={{ backgroundColor: desktopActiveTab === "query" ? "#fff" : '', borderColor: desktopActiveTab === "query" ? "#000" : "#e7eeff8f", color: desktopActiveTab === "query" ? "#000" : "#8c8f95" }}>{t("ai_qa")}</div>
          </div>
        </div>
        <div className="p-3">
          <div className="rounded-md overflow-hidden" style={{ border: '1px solid #e0e0e0', height: 'calc(100vh - 181px)' }}>
            {/* Details page */}
            <div className="flex-1 flex-col h-full overflow-y-auto " style={{ display: desktopActiveTab === "details" ? "" : "none" }}>
              <div className="flex-1 text-sm relative overflow-y-auto p-3" style={{ color: "#282c2b" }}>
                <div className="font-bold text-base ">{t("table.title")} :&ensp;<span className="text-slate-700 text-sm">{document.title}</span></div>
                <div className="font-bold text-base ">{t("table:author")} :&ensp;<span className="text-slate-700 text-sm">{document.inventor}</span></div>
                <div className="font-bold text-base ">{t("privilege_day")} :&ensp;<span className="text-slate-700 text-sm">{document.filing_date}</span></div>
                <div className="font-bold text-base ">{t("table.application_date")} :&ensp;<span className="text-slate-700 text-sm">{document.grant_date}</span></div>
                <div className="font-bold text-base ">{t("publication_date")} :&ensp;<span className="text-slate-700 text-sm">{document.publication_date}</span></div>
                <div className="font-bold text-base  mb-3">{t("original_text_summary")} :&ensp;<span className="text-slate-700 text-sm">{document.snippet}</span></div>
                {
                  translationSummaryText ?
                    <div>
                      <div className="font-semibold my-2">{t("translation_summary_result")}：</div>
                      <span className="text-orange-950">{translationSummaryText}</span>
                    </div>
                    : <></>
                }
                {
                  !translationSummaryText && document.language !== global.language ?
                    <div className="mb-3 flex">
                      <Theme onClick={onTranslationSummary}>
                        <Button size="sm" style={{ backgroundColor: '#bfbfbf', color: '#fff', fontSize: 12 }}>
                          {t("translation_summary")}
                          {actionTranslationSummary && <Spinner className="ml-2" />}
                        </Button>
                      </Theme>
                    </div> : <></>
                }
              </div>
              <div className="h-full">
                <div className="flex mb-5" style={{ borderBottom: '1px solid #e0e0e0', display: (desktopActiveTab === "details" && document?.figures.length) ? "flex" : "none" }}>
                  <div onClick={() => setSonTab("image")} className="w-28 text-center cursor-pointer" style={{ padding: "2.5px", borderBottom: sonTab === "image" ? "2px solid #296d4d" : "1px solid #f0f0f3", color: sonTab === "image" ? "#296d4d" : "#383838" }}>
                    {t("patent_image")}
                  </div>
                  <div onClick={() => setSonTab("pdf")} className="w-28 text-center cursor-pointer" style={{ padding: "2.5px", borderBottom: sonTab === "pdf" ? "2px solid #296d4d" : "1px solid #f0f0f3", color: sonTab === "pdf" ? "#296d4d" : "#383838" }}>
                    {t("pdf_file")}
                  </div>
                </div>
                <div className={`${document.figures.length && sonTab === 'image' ? '' : 'hidden'}`}>
                  {onRenderingImage}
                  {onRendering()}
                </div>
                <div className={`${sonTab === "pdf" || !document.figures?.length ? '' : 'hidden'} h-full w-full relative`}>
                  {onRenderingPdf()}
                </div>
              </div>
            </div>
            {/* Full text translation&AI Q&A */}
            <div className="flex-1 flex-col h-full" style={{ display: desktopActiveTab !== "details" ? "" : "none" }}>
              <div className="flex flex-1 w-full justify-around text-xs" style={{ borderBottom: "1px solid #e0e0e0" }}>
                <div onClick={() => setmobileTab("originalText")} className="w-full py-2 text-center cursor-pointer border-b" style={{ borderColor: mobileTab === "originalText" ? "#296d4d" : "#f3f3f3", color: mobileTab === "originalText" ? "#296d4d" : "#8c8f95" }}>
                  {t("original_text")}
                </div>
                <div onClick={() => setmobileTab("result")} className="w-full py-2 text-center cursor-pointer border-b" style={{ borderColor: mobileTab === "result" ? "#296d4d" : "#f3f3f3", color: mobileTab === "result" ? "#296d4d" : "#8c8f95" }}>
                  {t("result")}
                </div>
              </div>
              <div className="flex-1" style={{ height: 'calc(100vh - 218px)', backgroundColor: '#fff' }}>
                {/* original text */}
                <div style={{ display: mobileTab === "originalText" ? "" : "none", height: '100%' }}>
                  {onMobilePdf()}
                </div>
                {/* result */}
                <div className="felx-1 h-full" style={{ display: mobileTab === "result" ? "" : "none", height: '100%' }}>
                  {/* Full text translation */}
                  <div className={cn("flex-1 flex flex-col h-full", desktopActiveTab === "translate" ? "" : "hidden")} style={{ backgroundColor: "#f7f9f8" }}>
                    <div className="flex-1 text-sm overflow-y-auto relative" style={{ backgroundColor: "#eff3f2", color: "#282c2b" }}>
                      {!translatePdfUrl &&
                        <div className="flex-1 text-sm relative overflow-y-auto h-full" style={{ backgroundColor: "#fff", color: "#282c2b" }}>
                          {(fullTextTranslation || translating || translateErr) ?
                            <div className="text-base p-2 pt-1 overflow-y-auto flex flex-col justify-center items-center h-full">
                              {
                                translating ?
                                  <>
                                    <Loading type="sk-circle" />
                                    <Theme className="w-2/4">
                                      <Progress value={fullTextTranslation?.progress || 0} size="3" />
                                    </Theme>
                                  </>
                                  : <></>
                              }
                              {
                                <div style={{ ...enterStyles, color: '#8f8f8f', textAlign: 'left', fontSize: 12, width: translateWidth ? translateWidth : undefined }} >
                                  {
                                    fullTextTranslation?.history.length ?
                                      fullTextTranslation.history[fullTextTranslation.history.length - 1].replace("user_say-", "").replace("gpt_say-", "")
                                      : t("translation_in_progress")
                                  }
                                </div>
                              }
                              {
                                translateErr && <div className="my-1 p-2 flex gap-2" style={{ backgroundColor: "#ffe9f0", border: "0.8px solid #ffe9f0", color: "#d13372" }}>
                                  {translateErr}
                                  <div> {t("or")} <span className="underline cursor-pointer" onClick={() => {
                                    setFullTextTranslation(undefined)
                                    setTranslateErr(undefined)
                                    getTranslate()
                                  }} style={{ color: "rgb(0, 112, 240)" }}>{t("retry_to_generate")}</span></div>
                                </div>
                              }
                            </div> :
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] text-center">
                              <Select value={language} onValueChange={(value: string) => { setLanguage(value) }}>
                                <SelectTrigger>
                                  <SelectValue placeholder={<span className="text-muted-foreground">{t("selecet_lang")}</span>} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    {languageList.map((item => <SelectItem className="cursor-pointer" key={item.value} value={item.value}>{item.label}</SelectItem>))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                              <Button className="w-[60%] mt-5" size="lg" onClick={() => getTranslate()}>{t("start_translation")}</Button>
                            </div>
                          }
                        </div>
                      }
                      {translatePdfUrl &&
                        (!isMobile ?
                          <iframe src={translatePdfUrl + "#navpanes=0&toolbar=1"} height="100%" width="100%" /> :
                          <a
                            href={translatePdfUrl.replace("http://", "https://") + "#navpanes=0&toolbar=0"}
                            target="_blank"
                            style={{ backgroundColor: "#eff3f2", color: "#0070f0" }}
                            className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center font-bold">
                            {t("open_pdf")}
                          </a>
                        )}
                    </div>
                  </div>
                  {/* AI Q&A */}
                  <div className="flex-1 flex-col h-full relative" style={{ display: desktopActiveTab === "query" ? "flex" : "none" }}>
                    <div className="flex-1 text-sm h-full" style={{ backgroundColor: "#fff", color: "#282c2b", height: 'calc(100% - 60px)' }}>
                      <div id="answer" className="text-base overflow-y-auto p-2 pt-1 relative h-full">
                        {(!parsedPaper && !parsingPaper && parseErr === undefined) &&
                          <div onClick={parsePaper} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center cursor-pointer px-14 py-6 rounded-2xl" style={{ backgroundColor: "rgb(208 208 208 / 30%)" }}>
                            <svg width="55" height="55" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.900024 7.50002C0.900024 3.85495 3.85495 0.900024 7.50002 0.900024C11.1451 0.900024 14.1 3.85495 14.1 7.50002C14.1 11.1451 11.1451 14.1 7.50002 14.1C3.85495 14.1 0.900024 11.1451 0.900024 7.50002ZM7.50002 1.80002C4.35201 1.80002 1.80002 4.35201 1.80002 7.50002C1.80002 10.648 4.35201 13.2 7.50002 13.2C10.648 13.2 13.2 10.648 13.2 7.50002C13.2 4.35201 10.648 1.80002 7.50002 1.80002ZM3.07504 7.50002C3.07504 5.05617 5.05618 3.07502 7.50004 3.07502C9.94388 3.07502 11.925 5.05617 11.925 7.50002C11.925 9.94386 9.94388 11.925 7.50004 11.925C5.05618 11.925 3.07504 9.94386 3.07504 7.50002ZM7.50004 3.92502C5.52562 3.92502 3.92504 5.52561 3.92504 7.50002C3.92504 9.47442 5.52563 11.075 7.50004 11.075C9.47444 11.075 11.075 9.47442 11.075 7.50002C11.075 5.52561 9.47444 3.92502 7.50004 3.92502ZM7.50004 5.25002C6.2574 5.25002 5.25004 6.25739 5.25004 7.50002C5.25004 8.74266 6.2574 9.75002 7.50004 9.75002C8.74267 9.75002 9.75004 8.74266 9.75004 7.50002C9.75004 6.25738 8.74267 5.25002 7.50004 5.25002ZM6.05004 7.50002C6.05004 6.69921 6.69923 6.05002 7.50004 6.05002C8.30084 6.05002 8.95004 6.69921 8.95004 7.50002C8.95004 8.30083 8.30084 8.95002 7.50004 8.95002C6.69923 8.95002 6.05004 8.30083 6.05004 7.50002Z" fill="#8c8f95" fillRule="evenodd" clipRule="evenodd"></path></svg>
                            <div className=" text-lg font-bold text-center" style={{ color: "#8c8f95" }}>{t("ai_analysis")}</div>
                          </div>}
                        {
                          queryInfo?.history.map((history, index) => <>
                            {
                              history.indexOf("query-user_say-") === -1 && <>
                                {
                                  history.indexOf("err_code-") === -1 &&
                                  <div key={index} className="flex items-start gap-2" style={{ width: queryWidth ? queryWidth : undefined }}>
                                    <div key={index} className="my-1 p-2 text-left" style={{ ...enterStyles, maxWidth: '80%', borderRadius: 8, backgroundColor: '#f0efff', color: '#383838', border: "0.8px solid #f0efff" }} dangerouslySetInnerHTML={{ __html: history.replace("query-", "").replace("gpt_say-", "").replace("user_say-", "") }}></div>
                                  </div>
                                }
                                {
                                  history.indexOf("err_code-") > -1 && <>
                                    <div key={index} className="flex items-start gap-2">
                                      <div key={index} className="my-1 p-2 text-left" style={{ ...enterStyles, maxWidth: '80%', borderRadius: 8, backgroundColor: '#f0efff', color: '#383838', border: "0.8px solid #f0efff" }}>
                                        {history.indexOf("-10001") > -1 && ErrMessage(-10001, global.language, region)}
                                        {history.indexOf("-10002") > -1 && ErrMessage(-10002, global.language, region)}
                                        {history.indexOf("-10003") > -1 && ErrMessage(-10003, global.language, region)}
                                        {history.indexOf("-10004") > -1 && ErrMessage(-10004, global.language, region)}
                                        {history.indexOf("-10005") > -1 && ErrMessage(-10005, global.language, region)}
                                        {history.indexOf("-10006") > -1 && ErrMessage(-10006, global.language, region)}
                                        {history.indexOf("-10007") > -1 && ErrMessage(-10007, global.language, region)}
                                        {history.indexOf("-10008") > -1 && ErrMessage(-10008, global.language, region)}
                                        {history.indexOf("-10009") > -1 && ErrMessage(-10009, global.language, region)}
                                        {history.indexOf("-10012") > -1 && ErrMessage(-10012, global.language, region)}
                                        {history.indexOf("-1024") > -1 && ErrMessage(-1024, global.language, region)}
                                      </div>
                                    </div>
                                  </>
                                }
                              </>
                            }
                            {
                              history.indexOf("query-user_say-") > -1 &&
                              <div className="flex justify-end">
                                <div key={index} className="my-1 p-2 inline-block text-right" style={{ ...enterStyles, maxWidth: '80%', backgroundColor: '#f5f5f5', borderRadius: 8, color: '#383838', border: "0.8px solid #f5f5f5" }}>{history.replace("query-user_say-", "")}</div>
                              </div>
                            }
                          </>)}
                        {parsingPaper && <div className="flex items-start gap-2">
                          <Theme className="my-1 p-2 flex gap-2 items-center text-left" style={{ ...enterStyles, maxWidth: '80%', borderRadius: 8, backgroundColor: '#f0efff', color: '#383838', border: "1px solid #f0efff", }}>
                            <div style={{ color: "#383838" }}>{t("analyze_progress")} {queryInfo?.progress || 0} %</div>
                            <Spinner />
                          </Theme>
                        </div>}
                        {
                          parseErr && <div className="flex items-start gap-2">
                            <div className="my-1 p-2 flex gap-2 items-center cursor-pointer text-left" style={{ ...enterStyles, maxWidth: '80%', borderRadius: 8, backgroundColor: '#f0efff', color: '#383838', border: "0.8px solid #f0efff" }}>
                              {parseErr}
                              <div> {t("or")} <span onClick={() => {
                                setParseErr(undefined)
                                setQueryInfo(undefined)
                                parsePaper()
                              }} className="underline font-bold" style={{ color: "rgb(0, 112, 240)", backgroundColor: '#f0efff', }}>{t("reanalyze_ai")}</span></div>
                            </div>
                          </div>
                        }
                        {
                          querying && <div className="flex items-start gap-2">
                            <div className="my-1 p-2 w-20 flex justify-center text-left" style={{ ...enterStyles, maxWidth: '80%', borderRadius: 8, backgroundColor: '#f0efff', color: '#383838', border: "0.8px solid #f0efff" }}>
                              <div className="loader"></div>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                    <div className="flex gap-2 px-5 w-full" style={{ margin: '10px 0' }}>
                      <div className="relative w-full">
                        <Textarea
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              const dom = window.document.getElementById('query-button-desktop');
                              if (dom) {
                                dom.click();
                              }
                            }
                          }}
                          disabled={!parsedPaper || querying} value={query}
                          onChange={(e) => { setQuery(e.target.value) }}
                          className="bg-white h-10 pr-8"
                          placeholder={t("questioning.tips")} />

                        <div
                          id="query-button-desktop"
                          className={`absolute right-2 top-1/2 ${!parsedPaper || !query ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          onClick={() => {
                            if (!parsedPaper || !query) return;
                            setParseErr(undefined); queryPaper()
                          }}
                          style={{ backgroundColor: '#000', borderRadius: 50, padding: 8, transform: 'translateY(-50%) rotateZ(-45deg)' }}
                        >
                          <svg style={{ color: '#fff' }} width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.20308 1.04312C1.00481 0.954998 0.772341 1.0048 0.627577 1.16641C0.482813 1.32802 0.458794 1.56455 0.568117 1.75196L3.92115 7.50002L0.568117 13.2481C0.458794 13.4355 0.482813 13.672 0.627577 13.8336C0.772341 13.9952 1.00481 14.045 1.20308 13.9569L14.7031 7.95693C14.8836 7.87668 15 7.69762 15 7.50002C15 7.30243 14.8836 7.12337 14.7031 7.04312L1.20308 1.04312ZM4.84553 7.10002L2.21234 2.586L13.2689 7.50002L2.21234 12.414L4.84552 7.90002H9C9.22092 7.90002 9.4 7.72094 9.4 7.50002C9.4 7.27911 9.22092 7.10002 9 7.10002H4.84553Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {
        desktopActiveTab === 'details' && document.figures?.length ?
          <ImageViewer
            visible={imageVieweVisible}
            urls={document.figures.filter((_, index) => index <= currentPage * 10 && index > (currentPage - 1) * 10).map((item) => item.full)}
            onClose={() => setImageVieweVisible(v => !v)}
            index={imageVieweIndex}
            onIndexChange={setImageVieweIndex}
          /> : <></>
      }
    </DialogContent>
  </Dialog >
}