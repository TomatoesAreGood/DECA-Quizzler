import { Helmet } from 'react-helmet-async';

export function SEO({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  canonical
}) {
  const baseUrl = 'https://decaquizzer.com';
  const fullTitle = title ? `${title} | DECA Quizzer` : 'DECA Quizzer - Practice DECA Exams Online | Free Study Tool';
  const defaultDescription = 'Master your DECA exams with our free online quiz platform. Practice questions for Entrepreneurship, Finance, Marketing, Hospitality & Tourism, Business Management, and Core exams.';
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || 'DECA, DECA exams, DECA practice, ICDC, business competition, entrepreneurship, marketing, finance, hospitality, business management';
  const canonicalUrl = canonical ? `${baseUrl}${canonical}` : baseUrl;
  const ogTitleContent = ogTitle || fullTitle;
  const ogDescriptionContent = ogDescription || metaDescription;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={ogTitleContent} />
      <meta property="og:description" content={ogDescriptionContent} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta property="twitter:title" content={ogTitleContent} />
      <meta property="twitter:description" content={ogDescriptionContent} />
      <meta property="twitter:url" content={canonicalUrl} />
    </Helmet>
  );
}
