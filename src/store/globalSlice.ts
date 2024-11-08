import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'

interface GlobalStateProps {
  query: string
  sort_by: string;
  currentPage: number
  settings: { hideBrand: boolean },
  language: 'zh' | 'en' | 'ja'
}

export const globalStateSlice = createSlice({
  name: 'global',
  initialState: {
    query: '',
    sort_by: '',
    currentPage: 0,
    language: 'en',
    settings: { hideBrand: true },
  } as GlobalStateProps,
  reducers: {
    setGlobalState: (
      state: GlobalStateProps,
      action: PayloadAction<{
        [key in keyof GlobalStateProps]?: GlobalStateProps[key]
      }>
    ) => {
      const {  language, settings } = action.payload
      if (language !== undefined) state.language = language
      if (settings !== undefined) state.settings = settings
    },
    setQuery: (
      state: GlobalStateProps,
      action: PayloadAction<{ query: string, sort_by: string, currentPage: number }>
    ) => {
      const { query, sort_by, currentPage } = action.payload
      if (query !== undefined) state.query = query
      if (sort_by !== undefined) state.sort_by = sort_by
      if (currentPage !== undefined) state.currentPage = currentPage
    }
  }
})

export const { setGlobalState, setQuery } = globalStateSlice.actions
export const selectGlobal = (state: RootState) => state.global
export default globalStateSlice.reducer
