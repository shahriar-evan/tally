import React from "react";
import { Link } from "react-router-dom";
import { LegalLayout, H2, P, UL, ContactLine } from "../components/LegalLayout";
import { CONTACT_EMAIL } from "../lib/site";
import { CURRENCIES } from "../lib/currency";

const STORES = "Amazon, AliExpress, Daraz, Shopee and Lazada";
const COUNTRIES = Object.values(CURRENCIES).map((c) => c.label).join(", ");

export const AMAZON_STATEMENT = "As an Amazon Associate, Tally earns from qualifying purchases.";

/* ---------------- About ---------------- */
export const AboutPage = () => (
    <LegalLayout
        title="About Tally"
        path="/about"
        showUpdated={false}
        description="Tally is a price comparison site that shows delivery-included totals from major online stores, sorted cheapest first."
        intro="Tally exists for one reason: the same product costs different amounts in different stores, and working out the real cheapest option shouldn't take five open tabs and a calculator."
    >
        <H2>What we do</H2>
        <P>
            For each product, Tally lists the stores that sell it, what each one charges, and what delivery costs. We add the
            two together and sort by that total, so the first row is the cheapest thing you can actually pay.
        </P>
        <P>We currently cover {STORES}, with prices shown for shoppers in {COUNTRIES}.</P>

        <H2>What we don't do</H2>
        <UL>
            <li>We don't sell anything. When you tap Buy, you complete your order on the store's own website.</li>
            <li>We don't ask you to create an account.</li>
            <li>We don't let any store pay to move up the comparison. The cheapest total is always first.</li>
        </UL>

        <H2>How we're funded</H2>
        <P>
            Some links on Tally are affiliate links. If you buy after following one, the store may pay us a small commission at
            no extra cost to you. The details are on our <Link className="underline underline-offset-4" to="/affiliate-disclosure">affiliate disclosure</Link> page.
        </P>
    </LegalLayout>
);

/* ---------------- Contact ---------------- */
export const ContactPage = () => (
    <LegalLayout
        title="Contact"
        path="/contact"
        showUpdated={false}
        description="How to reach Tally, and where to go for help with an order."
        intro="Questions, a wrong price, or a store you'd like us to add: we'd like to hear about it."
    >
        <H2>Reach the Tally team</H2>
        {CONTACT_EMAIL ? (
            <P>
                Email <a className="underline underline-offset-4 font-medium" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                We usually reply within two working days.
            </P>
        ) : (
            <P>Our support inbox is being set up. This page will list the address as soon as it's ready.</P>
        )}

        <H2>Help with an order</H2>
        <P>
            Tally doesn't take payments or ship products, so we can't see or change your order. For delivery, returns, refunds or
            warranty questions, contact the store you bought from. Its name is on the Buy button you used and on your order confirmation.
        </P>

        <H2>Report a wrong price</H2>
        <P>
            Store prices change often. If a price on Tally doesn't match the store's page, tell us the product and the store and
            we'll correct it. The price on the store's own checkout is always the one that applies.
        </P>
    </LegalLayout>
);

/* ---------------- Privacy ---------------- */
export const PrivacyPage = () => (
    <LegalLayout
        title="Privacy Policy"
        path="/privacy"
        description="What information Tally collects, why, and the choices you have."
        intro="Tally is built to work without knowing who you are. This page explains the small amount of information involved in running it."
    >
        <H2>No accounts</H2>
        <P>You can use Tally without signing up or giving us your name, email address or payment details.</P>

        <H2>What is stored in your browser</H2>
        <P>Tally saves a few settings in your browser's local storage so they stay the same next time you visit:</P>
        <UL>
            <li>your light or dark theme</li>
            <li>the currency you picked, if you changed it yourself</li>
        </UL>
        <P>These stay on your device. You can remove them at any time by clearing this site's data in your browser settings.</P>
        <P>
            To make the site load faster and work with a weak connection, your browser may also keep a copy of Tally's own
            pages and images. This contains no personal information.
        </P>

        <H2>Your country and currency</H2>
        <P>
            When you first visit, our hosting provider tells us which country your connection comes from, based on your IP
            address. We use it only to show prices in your local currency. We don't store the country or your IP address with
            anything else.
        </P>

        <H2>Clicks on Buy</H2>
        <P>
            When you tap Buy, we record which product and store you chose and the time. We use these counts to see which
            products and stores are useful and to check affiliate reports. The record doesn't include your name, IP address or any way to identify you.
        </P>

        <H2>Services we rely on</H2>
        <UL>
            <li><b>Vercel</b> hosts the site and, like any web host, processes your IP address to deliver pages and keep the service secure.</li>
            <li><b>MongoDB Atlas</b> stores product, price and click information.</li>
            <li><b>Google Fonts</b> serves the site's fonts, so your browser connects to Google's servers to load them.</li>
            <li>Product and category photos load from <b>Unsplash</b> and <b>Pexels</b>.</li>
        </UL>
        <P>We don't run advertising networks or analytics tools that build a profile of you.</P>

        <H2>Stores you visit from Tally</H2>
        <P>
            When you follow a link to a store, you leave Tally. That store, and its affiliate program, may set its own cookies to
            record that you came from Tally. Their privacy policies apply from that point.
        </P>

        <H2>Children</H2>
        <P>Tally is meant for adult shoppers and doesn't knowingly collect information from children.</P>

        <H2>Changes and questions</H2>
        <P>
            If we change how Tally handles information, we'll update this page and the date at the top. For questions about
            privacy, <ContactLine />.
        </P>
    </LegalLayout>
);

/* ---------------- Terms ---------------- */
export const TermsPage = () => (
    <LegalLayout
        title="Terms of Use"
        path="/terms"
        description="The terms that apply when you use Tally's price comparison."
        intro="By using Tally you agree to these terms. They're short because the service is simple: we show prices, and you buy from the store you choose."
    >
        <H2>What Tally is</H2>
        <P>
            Tally is a price comparison service. We aren't a store, we don't sell products, and we aren't a party to any purchase
            you make. Your order is a contract between you and the store, under that store's terms.
        </P>

        <H2>Prices and availability</H2>
        <UL>
            <li>Prices, delivery fees and stock come from the stores and can change at any time, sometimes before we update them.</li>
            <li>Totals on Tally include the store's listed delivery fee. Taxes, import duties and payment fees may be added by the store at checkout.</li>
            <li>Prices in currencies other than US dollars are converted at a reference rate and are estimates.</li>
            <li>The price shown at the store's checkout is the one that applies.</li>
        </UL>

        <H2>Links to other websites</H2>
        <P>
            Buy buttons take you to third-party stores. We don't control those sites and aren't responsible for their products,
            delivery, returns, content or privacy practices.
        </P>

        <H2>Using Tally fairly</H2>
        <P>Please don't:</P>
        <UL>
            <li>copy our listings in bulk or scrape the site with automated tools</li>
            <li>try to break, overload or get around the security of the service</li>
            <li>use Tally for anything unlawful</li>
        </UL>

        <H2>No warranty</H2>
        <P>
            We work to keep information accurate, but Tally is provided as it is, without guarantees that every price is current
            or that the service will always be available. To the extent the law allows, we aren't liable for losses arising from
            using Tally or from purchases made on other websites.
        </P>

        <H2>Changes</H2>
        <P>
            We may update these terms. The date at the top shows the latest version, and continuing to use Tally means you accept it.
            For questions, <ContactLine />.
        </P>
    </LegalLayout>
);

/* ---------------- Affiliate disclosure ---------------- */
export const AffiliateDisclosurePage = () => (
    <LegalLayout
        title="Affiliate disclosure"
        path="/affiliate-disclosure"
        description="How Tally earns money from affiliate links, and why it never changes the order of results."
        intro="Tally is free to use. It's funded by affiliate commissions, and you should know exactly how that works."
    >
        <H2>How it works</H2>
        <P>
            Some Buy buttons on Tally are affiliate links. If you follow one and then buy something, the store may pay Tally a
            commission. You pay the same price you would if you'd gone to the store directly.
        </P>
        <P>We take part, or plan to take part, in the affiliate programs of {STORES}.</P>
        <P><b>{AMAZON_STATEMENT}</b></P>

        <H2>What commissions don't change</H2>
        <UL>
            <li>The order of results. Offers are always sorted by total price, cheapest first.</li>
            <li>Which stores we show. A store appears because it sells the product, not because it pays more.</li>
            <li>The price you pay.</li>
        </UL>

        <H2>Sponsored placements</H2>
        <P>
            If we ever feature a product or store because it paid us, it will be clearly labelled "Sponsored" and kept separate
            from the comparison list.
        </P>

        <H2>Questions</H2>
        <P>If anything here is unclear, <ContactLine />.</P>
    </LegalLayout>
);
