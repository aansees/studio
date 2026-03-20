import Link from "next/link";
import data from "./[slug]/data.json";

export default async function Project() {
  return (
    <div className="flex h-screen items-center justify-center flex-col gap-10">
      <h1 className="text-4xl font-bold">Project Page</h1>
      <div className="flex items-center justify-center flex-col gap-5">
        {data.map((project) => (
          <div key={project.slug}>
            <h2 className="text-2xl font-semibold">{project.title}</h2>
            <Link
              href={`/featured-work/${project.slug}`}
              className="text-blue-500 hover:underline"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
