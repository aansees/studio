import { projectsData } from "../../work/projects";

const featuredProjectsContent = projectsData.slice(0, 4).map((project) => ({
  info: project.featuredInfo,
  title: project.name,
  description: project.featuredDescription,
  image: project.image,
}));

export default featuredProjectsContent;
