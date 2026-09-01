import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

const SITE_NAME = "Kingdom Mission Network";
const DEFAULT_DESC = "A global community of believers united in faith, prayer, and worship. Join us for sermons, events, and daily Bible study.";

export default function SEO({ title, description, image, url }: SEOProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const desc = description || DEFAULT_DESC;
  const img = image ? (image.startsWith("http") ? image : `https://kingdommissionsnetwork.org${image}`) : "https://kingdommissionsnetwork.org/logo.png";
  const href = url ? (url.startsWith("http") ? url : `https://kingdommissionsnetwork.org${url}`) : "https://kingdommissionsnetwork.org";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={href} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:image:secure_url" content={img} />
      <meta property="og:url" content={href} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}
