import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import WeeklyView from './pages/WeeklyView'
import PlanView from './pages/PlanView'
import HolidaysView from './pages/HolidaysView'
import LoginPage from './pages/LoginPage'
import useStore from './store/useStore'

function App() {
  const { isAuthenticated } = useStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <Header />
      <Routes>
        <Route path="/" element={<WeeklyView />} />
        <Route path="/plan" element={<PlanView />} />
        <Route path="/holidays" element={<HolidaysView />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
