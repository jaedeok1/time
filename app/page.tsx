import Link from "next/link";
import { Calendar, Users, CheckCircle, Clock, History } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-600" />
          <span className="text-xl font-bold text-indigo-700">시간 조율</span>
          <div className="ml-auto">
            <Link
              href="/my"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <History className="w-4 h-4" />
              내 모임
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            모임 시간, 쉽게 맞추세요
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            참가자들이 불가능한 시간을 표시하면, 가장 많은 사람이 참석 가능한 시간을 자동으로 찾아드립니다.
          </p>
          <Link
            href="/meetings/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg"
          >
            <Calendar className="w-5 h-5" />
            모임 만들기
          </Link>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">이용 방법</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 rounded-full p-4 mb-4">
                <Calendar className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="bg-indigo-600 text-white text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">모임 만들기</h3>
              <p className="text-gray-600 text-sm">
                모임 이름, 날짜 범위, 응답 마감일을 설정하고 모임을 생성합니다.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 rounded-full p-4 mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="bg-indigo-600 text-white text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">참가자 응답</h3>
              <p className="text-gray-600 text-sm">
                초대 링크를 공유하면 참가자들이 불가능한 시간대를 표시합니다.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 rounded-full p-4 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="bg-indigo-600 text-white text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">최적 시간 확정</h3>
              <p className="text-gray-600 text-sm">
                시스템이 가장 많은 사람이 참석 가능한 시간을 계산해 보여줍니다.
              </p>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">간편한 참여</h3>
            <p className="text-gray-600 text-sm">별도 회원가입 없이 이름과 전화번호만으로 참여할 수 있습니다.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">실시간 현황</h3>
            <p className="text-gray-600 text-sm">주최자는 실시간으로 응답 현황과 최적 시간을 확인할 수 있습니다.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">응답 수정 가능</h3>
            <p className="text-gray-600 text-sm">제출 후에도 링크를 통해 언제든지 응답을 수정할 수 있습니다.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">스마트 분석</h3>
            <p className="text-gray-600 text-sm">참석 가능 인원이 가장 많은 시간대 순으로 자동 정렬합니다.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm">
        <p>시간 조율 서비스</p>
      </footer>
    </div>
  );
}
