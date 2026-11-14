import { contentsService } from "@/services/contents.service";
import { PostsManager } from "@/components/posts/posts-manager";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const { data, error } = await contentsService.getContentsSafe();

  return <PostsManager initialPosts={data} initialError={error} />;
}
