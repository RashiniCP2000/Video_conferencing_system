import { useNavigate } from "react-router-dom";
import thankYouImage from "../assets/education-form.jpg";

export default function EducationDataThankYou() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="text-2xl font-black tracking-tight text-blue-700">MeetNova</div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <span>Already have an account?</span>
            <button onClick={() => navigate("/login")} className="font-semibold text-blue-600 hover:text-blue-700">
              Sign In
            </button>
            <span className="text-slate-300">•</span>
            <a href="#" className="font-medium hover:text-blue-600">
              Support
            </a>
            <button className="inline-flex items-center gap-1 font-medium hover:text-blue-600">
              English
              <span className="text-xs">▾</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-73px)] items-center px-6 py-12">
        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2">
          <div className="flex items-center justify-center">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-slate-100">
              <img
                src={thankYouImage}
                alt="Thank you for education"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-3">
              <h1 className="text-5xl font-bold tracking-tight text-slate-900">
                Thank you for your work in education
              </h1>
              <p className="text-xl text-slate-600">
                Now you can use your MeetNova account now.
              </p>
            </div>

            <button
              onClick={() => navigate("/")}
              className="inline-block w-fit rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700"
            >
              Go to My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
