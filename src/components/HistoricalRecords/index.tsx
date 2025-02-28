import { Button } from "../ui/button"
import { FaEye } from "react-icons/fa";
import { LuHistory } from "react-icons/lu";
import { useEffect, useState } from "react";
import DocumentDialog, { languageList } from "../DocumentDialog";
import { MdFileDownload } from "react-icons/md";
import { MdDeleteOutline } from "react-icons/md";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import { IPatentList, deleteData, getDataList, IAIPatentRecordList } from "./indexedDB";
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";

export function HistoricalRecords(props: { onPreview: (item: IAIPatentRecordList) => void }) {
  const { t } = useTranslation();

  const [recordList, setRecordList] = useState<IAIPatentRecordList[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      getDataList().then(res => {
        setRecordList(res)
      })
    }
  }, [open])

  const onDel = async (id: number) => {
    const result = await deleteData(id);
    setRecordList(result)
  }

  const swapDomain = (url: string): string => {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'file.302.ai') {
      urlObj.hostname = 'file.302ai.cn';
    } else if (urlObj.hostname === 'file.302ai.cn') {
      urlObj.hostname = 'file.302.ai';
    }
    return urlObj.toString();
  };

  const onDownload = async (url: string, retried = false, id?: string) => {
    const filename = url.split('/').pop() || 'document.pdf';
    const toastId = id || toast.warning(t('file_downloading')); // Updated
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network error');
      const blob = await response.blob();

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      toast.done(toastId);
    } catch (error) {
      if (!retried) {
        const newUrl = swapDomain(url);
        // @ts-ignore
        await onDownload(newUrl, true, toastId);
      } else {
        toast.error(t('download_failed')); // Updated
        toast.dismiss(toastId);
      }
    }
    toast.dismiss(toastId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="p-0 m-0"><LuHistory className="text-lg" /></Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] max-h-[300px] overflow-y-auto" align="end" side="bottom">
        <div className="grid grid-cols-1 gap-4">
          {
            recordList.length ? recordList.map(item => (
              <div className="flex items-center justify-between gap-5" key={item.id}>
                <div className="w-full overflow-hidden grid gap-1">
                  <div className="text-sm font-bold flex items-center gap-1">
                    <div className="min-w-fit">{item.type === 'translate' ? t('translation_result') 
                      : item.type === 'search' ? t('search_result') : t('summary_translation_result')}
                    </div>
                    <p className="text-slate-600 font-medium text-ellipsis whitespace-nowrap overflow-hidden w-[160px]">{item.title}</p>
                  </div>
                  <div className="text-slate-500 text-xs flex items-center gap-3">
                    <span>{item.created_at}</span>
                    <span>{languageList.find(f => f.value === item?.translateFiel?.language)?.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {
                    item.type === 'translate' ?
                      <MdFileDownload className='cursor-pointer' onClick={() => onDownload(item?.translateFiel?.url || '')} /> :
                      item.type === 'search' ?
                        <FaEye className='cursor-pointer' onClick={() => props.onPreview(item)} /> :
                        <DocumentDialog document={item.abstract?.item as IPatentList} languageType={item.language}  isRecord={true} recordData={item} />
                  }
                  <MdDeleteOutline className="text-rose-700 cursor-pointer" onClick={() => { onDel(item.id || 0) }} />
                </div>
              </div>
            )) :
              <div className="flex flex-col gap-5 items-center justify-center font-bold text-slate-500">
                <img src="/empty.png" className="w-[150px]" />
                {t('no_operation_history')}
              </div>
          }
        </div>
      </PopoverContent>
    </Popover>
  )
}
