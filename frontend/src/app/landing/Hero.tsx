// "use client";

// import { ArrowRight } from "lucide-react";
// import { useRouter } from "next/navigation";

// export default function Hero() {

//   const router = useRouter();

//   return (
//     <section className="relative pt-40 pb-28">

//       <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

//         {/* LEFT SIDE */}
//         <div>

//           <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-xs text-indigo-600 mb-6">
//             AI-Powered Student Productivity
//           </div>

//           <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
//             Study Smarter,
//             <span className="text-indigo-600"> Not Harder</span>
//           </h1>

//           <p className="mt-6 text-lg text-slate-500 max-w-lg">
//             EduSense helps university students plan studies, manage deadlines,
//             and collaborate intelligently using AI-driven scheduling and analytics.
//           </p>

//           <div className="flex gap-4 mt-8">
//             <button
//               onClick={() => router.push("/dashboard")}
//               className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700"
//             >
//               Explore Dashboard <ArrowRight size={18}/>
//             </button>

//             <button className="px-6 py-3 border border-slate-300 rounded-lg">
//               Learn More
//             </button>
//           </div>

//         </div>

//         {/* RIGHT SIDE */}
//         <DashboardPreview/>

//       </div>

//     </section>
//   );
// }