import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { MainLayout } from "@/components/layout"
import {
  LendersPage,
  LenderDetailsPage,
  DealMatcherPage,
  MarketIntelligencePage,
  CrawlerPage,
  ApplyPage,
  LeadsPage,
  WhyUsPage,
  AdminPage,
} from "@/pages"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/why-us" replace />} />
          <Route path="lenders" element={<LendersPage />} />
          <Route path="lenders/:lenderId" element={<LenderDetailsPage />} />
          <Route path="match" element={<DealMatcherPage />} />
          <Route path="market" element={<MarketIntelligencePage />} />
          <Route path="crawler" element={<CrawlerPage />} />
          <Route path="apply" element={<ApplyPage />} />
          <Route path="apply/:product" element={<ApplyPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="why-us" element={<WhyUsPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
