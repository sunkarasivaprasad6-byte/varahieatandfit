import { redirect } from "next/navigation";

/**
 * The subscription cards live on the main website homepage.
 * Keep this route as a compatibility redirect so old links/bookmarks
 * cannot open the outdated subscription page.
 */
export default function SubscriptionsPage() {
  redirect("/#subscriptions");
}
