'use client';

import Navbar from '../../../components/Navbar';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DocsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const initialTab = (tabParam === 'trial-resolution' || tabParam === 'review-boards' || tabParam === 'idea-futures' || tabParam === 'economics') 
    ? tabParam 
    : 'trial-resolution';
  const [activeTab, setActiveTab] = useState<'trial-resolution' | 'economics' | 'idea-futures' | 'review-boards'>(initialTab);
  
  useEffect(() => {
    if (tabParam && (tabParam === 'trial-resolution' || tabParam === 'review-boards' || tabParam === 'idea-futures' || tabParam === 'economics')) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('trial-resolution')}
              className={`pb-2 px-1 font-sans text-lg font-semibold transition-colors ${
                activeTab === 'trial-resolution'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Trial & Resolution Procedure
            </button>
            <button
              onClick={() => setActiveTab('economics')}
              className={`pb-2 px-1 font-sans text-lg font-semibold transition-colors ${
                activeTab === 'economics'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Economics
            </button>
            <button
              onClick={() => setActiveTab('idea-futures')}
              className={`pb-2 px-1 font-sans text-lg font-semibold transition-colors ${
                activeTab === 'idea-futures'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Idea Futures
            </button>
            <button
              onClick={() => setActiveTab('review-boards')}
              className={`pb-2 px-1 font-sans text-lg font-semibold transition-colors ${
                activeTab === 'review-boards'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Review Boards
            </button>
          </div>

          {activeTab === 'trial-resolution' && (
            <div>
              <h2 className="text-2xl font-bold text-black font-sans mb-3 mt-10">Introduction</h2>
              <p className="text-gray-800 leading-7 mb-4">
                The trial procedure is based on the Science Court System designed by Prof. Ellad Tadmors who ran a Science Court Class at the University of Minnesota. The original idea for science courts came from Prof. Arthur Kantrowitz who proposed the idea in the 1970s and succeeded in convincing the Ford administration to create science courts, however Ford lost his bid for reelection shortly thereafter and the courts were never implemented at the federal level.
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                Professor Tadmor&apos;s science courts dealt with policy questions like &quot;should the US increase investment in nuclear energy&quot; and at the end of the deliberation process, undergrad jurists vote on what action they would recommend based on an agreed upon fact sheet produced by the trial procedure.
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                Professor Kantrowitz&apos;s proposed science courts dealt with questions of scientific fact like whether the Love Canal environmental disaster increased birth defects and genetic hazards among residents. After an adversarial process of cross examination, technical judges submitted opinions on the merits of each side&apos;s argument but the court did not attempt to achieve total resolution of the underlying question. Kantrowitz viewed the exercise as encouraging, noting that it added clarity on a complex issue. Kantrowitz&apos;s science courts used juryists with technical expertise while Tadmor&apos;s courts used undergrad students since the course was run as a class at the University of Minnesota.
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                The trial procedure for the science courts run by Tadmor and Kantrowitz are nearly identical, so The Citizen will implement the same trial and procedure process from these previous attempts. The first point of differentiation between previous science courts is that The Citizen will venture to resolve the market by making a judgement about the underlying claim based on the factsheet produced by the trial. The second point of differentiation is that The Citizen&apos;s crowd-sourced evidence section will aid the case managers in their research. Case managers are responsible for representing a market position and responding to any challenges from opposing counsel regarding disputed facts. The case manager&apos;s research is not limited to the evidence section but the evidence section should be useful in finding good evidence in support of the respective positions. If the evidence section is effective at finding and ordering the best arguments, then The Citizen will explore removing case managers entirely and proceed with having technical jurists review the claims made in the evidence section.
              </p>
              
              <h2 className="text-2xl font-bold text-black font-sans mb-3 mt-10">Market Rules</h2>
              <p className="text-gray-800 leading-7 mb-4">
                Before proceeding to the trial procedure, the market question scope and the burden of proof need to be clearly defined.
              </p>
              
              <h3 className="text-xl font-bold text-black font-sans mb-3 mt-6">Question Scope</h3>
              <p className="text-gray-800 leading-7 mb-4">
                The question scope defines the underlying claim that the market is trying to answer. A JFK market could ask the following questions with one being more general and the other being more specific:
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                <strong>General</strong> - Was the CIA Involved in the Assassination of JFK?
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                <strong>Specific</strong> - Did multiple assassins shoot at JFK on 11/22/1963?
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                One focuses on a specific factual claim, multiple shooters, while the other opens a set of possible claims that could satisfy the more general term &quot;involved.&quot; The term involved needs to be defined to provide clear criteria that the jury will judge evidence against. In the context of this question, involved means direct participation in planning or executing the act, foreknowledge and failure to prevent it, facilitation through assets or proxies, or post-assassination cover-up.
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                Professor Tadmor recommends the general question since it produces a broader fact sheet than the narrowly defined claim. However, the more possible sub-claims that a question generates the more cumbersome the judging process since the jury will need to litigate each claim. For the sake of producing a more extensive fact sheet, the general question will proceed and the following defines the question that the market will attempt to answer:
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                Was the CIA Involved in the Assassination of JFK?
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                Involved means direct participation in planning or executing the act, foreknowledge and failure to prevent it, facilitation through assets or proxies, or post-assassination cover-up.
              </p>

              <h3 className="text-xl font-bold text-black font-sans mb-3 mt-6">Burden of Proof</h3>
              <p className="text-gray-800 leading-7 mb-4">
                Next, the market needs to define the burden of proof by which the jury (&quot;board of editors&quot;) will evaluate the claim. Below are some options for the burden of proof:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-800 leading-7 mb-4">
                <li>The market will resolve &quot;Yes&quot; if the board of editors concludes that it is reasonable to conclude (&gt;~51% confidence) that the CIA was involved in JFK&apos;s assassination? Otherwise, the market will resolve &quot;No.&quot;</li>
                <li>The market will resolve &quot;Yes&quot; if the board of editors finds that it is more likely than not that the CIA (&gt;51% confidence) was involved in JFK&apos;s assassination. Otherwise, the market will resolve &quot;No.&quot;</li>
                <li>The market will resolve &quot;Yes&quot; if the board of editors finds there is a preponderance of the evidence (&gt;51% confidence) that the CIA was involved in the assassination of JFK. Otherwise, the market will resolve &quot;No.&quot;</li>
                <li>The market will resolve &quot;Yes&quot; if the board of editors finds that there is clear and convincing evidence (&gt;75% confidence) that the CIA was involved in the assassination of JFK. Otherwise, the market will resolve &quot;No.&quot;</li>
                <li>The market will resolve &quot;Yes&quot; if the board of editors finds that beyond a reasonable doubt (&gt;95% confidence) that the CIA was involved in the assassination of JFK. Otherwise, the market will resolve &quot;No.&quot;</li>
              </ol>
              <p className="text-gray-800 leading-7 mb-4">
                The previous science courts were not market based so they did not have to define specific market rules. Professor Tadmor&apos;s science court did define a &quot;pro-ish&quot; and &quot;con-ish&quot; side of their policy debate but this framework cannot be neatly applied to the defined market question. 
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                The burden of proof wording proposal with the clearest language and acceptably high burden of evidence is the fourth proposal - clear and convincing evidence. Beyond a reasonable doubt is too difficult to prove considering that The Citizen does not have the authority to enforce discovery from the CIA or any party that might be involved in this case. Using &quot;more likely than not&quot; as the burden of proof, can cause the market evidence and trial proceeding to be too circumstantial leading to a flimsy resolution. The market rules will proceed with the following phrasing:
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                The market will resolve &quot;Yes&quot; if the board of editors finds that there is clear and convincing evidence (&gt;75% confidence) that the CIA was involved in the assassination of JFK. Otherwise, the market will resolve &quot;No.&quot;
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                Involved means direct participation in planning or executing the act, foreknowledge and failure to prevent it, facilitation through assets or proxies, or post-assassination cover-up.
              </p>

              <h2 className="text-2xl font-bold text-black font-sans mb-3 mt-10">Personnel Selection &amp; Pay</h2>
              <p className="text-gray-800 leading-7 mb-4">
                The markets will be resolved by a panel of three neutral judges known as &quot;board of editors&quot; that have domain expertise. The Citizen that will draft three judges that meet the following criteria:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-800 leading-7 mb-4">
                <li>Male born in the United States</li>
                <li>Phd. or Phd. candidate in relevant field</li>
                <li>Self-proclaimed neutral and undecided on the particular question at hand</li>
              </ul>
              <p className="text-gray-800 leading-7 mb-4">
                The board of editors will be compensated at a level commensurate with one week&apos;s wages of a typical Post Doc Program. Each will be paid $1,300 dollars in exchange for one week of their time. The total cost of fielding the jury will be $3,900. The jurist pay will depend on the wage market dynamics so the cost to field the judges may vary.
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                Case Managers are responsible for representing their respective side of the market and they are ideally pundits who already publicly debate the market position. If possible, The Citizen will not pay Case Managers since the trial procedures are a platform to expand their research and increase their personal profile. In the Love Canal case, the case managers were not paid anything and were local scientists who were already debating the issue in the local community.
              </p>

              <h2 className="text-2xl font-bold text-black font-sans mb-3 mt-10">Procedure Timing</h2>
              <p className="text-gray-800 leading-7 mb-4">
                The market timing and resolution will be timed as follows:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-800 leading-7 mb-4">
                <li><strong>Trading &amp; Discovery Three Months</strong> - The market and evidence section will be open for a period of three months to enable traders to take positions and post relevant evidence to the evidence section. At the end of the discovery period, case managers will submit their list of factual claims ordered by importance to their case.</li>
                <li><strong>Deliberation &amp; Resolution One Week</strong> - Immediately after market close, the deliberation process will begin as described below in the trial procedure section. At the end of this period, the judges will produce a fact sheet that they will use to make their final judgement, thus resolving the market.</li>
              </ol>
              <p className="text-gray-800 leading-7 mb-4">
                The procedure timing aligns with Professor Tadmor&apos;s court which permitted months of prior research heading into the trial period but a one-day pre-trial session, a one-day mediation session, and followed by a three-hour jury session where the judges produced the final fact sheet. 
              </p>

              <h2 className="text-2xl font-bold text-black font-sans mb-3 mt-10">Trial Proceedings</h2>
              <p className="text-gray-800 leading-7 mb-4">
                After the market discovery period is closed and both sides submit their list of factual claims ordered by importance, the one week mediation process will begin concluding with the board of editors producing a fact sheet and issuing their final judgement, resolving the market. The trial procedure below is taken directly from Professor Kantrowitz&apos;s proposal and Professor&apos;s Tadmor&apos;s court roughly followed the same process in an oral format:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-800 leading-7 mb-4">
                <li>Each case manager reviews the series of factual statements submitted by the opposing case manager.</li>
                <li>Each case manager is invited to accept or challenge each of the opponent&apos;s statements</li>
                <li>The list of statements accepted by both sides will constitute the first output from the court</li>
                <li>Challenged statements are first dealt with by a mediation procedure in which attempts are made to narrow the area of disagreement or to negotiate a revised statement of fact which both case managers can accept</li>
                <li>The mediated statements are added to the court&apos;s output. Those statements which remain challenged are then subjected to an adversary procedure.</li>
                <li>Case managers prepare substantiation papers on statements remaining challenged and transmit these to the judges and the opposing case managers, starting with the first, the most important challenged statement.</li>
                <li>The substantiation is cross-examined by opposing case managers and judges and contrary evidence is presented and cross-examined.</li>
                <li>A second attempt to negotiate a mediated statement is made and, if successful, this statement is added to the Science Court&apos;s output.</li>
                <li>If this is not successful the judges write their opinions on the contested statement of fact.</li>
                <li>This procedure is repeated for each of the challenged statements.</li>
                <li>The accepted statements plus the judges&apos; statements constitute the final output of the procedure.</li>
              </ol>

              <h2 className="text-2xl font-bold text-black font-sans mb-3 mt-10">Trial Resolution</h2>
              <p className="text-gray-800 leading-7 mb-4">
                Using the only court produced fact sheet, each judge issues their opinion regarding whether the evidence meets the defined burden of proof.
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                For the market to resolve &quot;Yes,&quot; at least two out of three judges need to agree that the evidence presented meets the burden of proof.
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                After the judgement is issued, the fact sheet is then released to the public and the market is resolved.
              </p>
            </div>
          )}

          {activeTab === 'economics' && (
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black font-sans mb-4">Economics</h1>
              <p className="text-gray-800 leading-7 mb-4">
                Data is not valuable, the truth is. The Citizen is a fact finding and verification platform that crowdsources claims and uses prediction markets to confirm their authenticity.
              </p>
              
              <h2 className="text-2xl font-bold text-black font-sans mb-3 mt-10">Market Resolution</h2>
              <p className="text-gray-800 leading-7 mb-4">
                The markets will be resolved by a panel of three neutral judges that have domain expertise. The Citizen that will draft three judges that meet the following criteria:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-800 leading-7 mb-4">
                <li>Male born in the United States</li>
                <li>Phd. or Phd. candidate in relevant field</li>
                <li>Self-proclaimed neutral and undecided on the particular question at hand</li>
              </ul>
              <p className="text-gray-800 leading-7 mb-4">
                To preserve the integrity of the panel, the identity of the judges will never be revealed. This will ensure that the panel is free to make any judgement without fear of backlash. Extraordinary measures will be taken to never reveal the identity of the judges. Judging anonymity may increase the honesty of the traders since they will not be able to guess the biases of the judges based on public information, instead they can only rely on the evidence presented. 
              </p>
              
              <h2 className="text-2xl font-bold text-black font-sans mb-3 mt-10">Judging Incentives</h2>
              <p className="text-gray-800 leading-7 mb-4">
                The Judges will be paid using two different methods.
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-800 leading-7 mb-4">
                <li>Each judge will receive a 1% vig on all bets wagered on the market.</li>
                <li>Each judge will collect a $1 royalty on the case summary that will be published at the end of the market. The caveat is that the the royalty payments will stop if their decision is overturned in a later appeals market.</li>
              </ol>
              <p className="text-gray-800 leading-7 mb-4">
                The vig is collected on all trades. If a market does $100,000 in volume, each judge will earn $1,000 from the vig.
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                If the case summary sells 1,000 copies at $6 dollar per, each judge will earn $1,000. However if their decision is overturned in an appeals market, then the overturning panel will publish a new paper and the old judges from the overturned decision will not receive any proceeds from the new paper.
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                Judges are incentivized to make a truthful decision that can withstand scrutiny to preserve their future royalty payments. If the decision succeeds in telling the truth and avoiding appeals courts, the judges can collect royalty payments for eternity. If a paper sells 200,000 copies over its life-time, each judge will earn $200,000. 
              </p>
              
              <h2 className="text-2xl font-bold text-black font-sans mb-3 mt-10">Appeals Markets</h2>
              <p className="text-gray-800 leading-7 mb-4">
                Each month, the market decision with the highest number of weighted trader votes will be restarted with the evidence section cleared and the market odds set back to 50-50. After the market expires, a new paper will be published by the new set of judges and replace the old case summary. 
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                If the previous decision is upheld, the previous judges and the new judges will split the royalties at $1 per sale and The Citizen will stop receiving royalty payments. If the new judges overturn the previous decision, the previous judges will stop receiving the royalties and the royalties will be split between The Citizen and the new judges.
              </p>
              
              <h2 className="text-2xl font-bold text-black font-sans mb-3 mt-10">Citizen Economics</h2>
              <p className="text-gray-800 leading-7 mb-4">
                The Citizen will lose money on market making. For the initial markets, The Citizen will lose $6,931 on providing initial liquidity and the vig collected from the market will be split amongst the judges. However, The Citizen will take 50% of the royalties from the case summaries. At $6 per case summary, this means that the Citizen needs to sell 2,310 case summaries to break even on the market making. Any case studies sold after the 2,310th will result in the venture being profitable. The Citizen eventually expects to pivot to a subscription model where subscribers will pay $10 per month, but the initial payment model will be based on individual case summaries.
              </p>
              
              <h2 className="text-2xl font-bold text-black font-sans mb-3 mt-10">Judging Criteria</h2>
              <p className="text-gray-800 leading-7 mb-4">
                Each judge will categorize their final opinion in one of the following buckets:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-800 leading-7 mb-4">
                <li>No - beyond a reasonable doubt (estimated confidence of 95%)</li>
                <li>No - clear preponderance of evidence (estimated confidence of 70%)</li>
                <li>No - inconclusive for both sides (estimated confidence of less than 70%)</li>
                <li>Yes - clear preponderance of evidence (estimated confidence of 70%)</li>
                <li>Yes - beyond a reasonable doubt (estimated confidence of 95%)</li>
              </ol>
              <p className="text-gray-800 leading-7 mb-4">
                Only when the judges unanimously conclude, &quot;Yes - beyond a reasonable doubt&quot; will the market resolve Yes. The Citizen is also considering using an override system where if two judges agree on a category and the third disagrees, that the agreeing two judges can override the third judge&apos;s opinion to reach a final opinion.
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                In an appeals market, only when a market resolution is overturned from Yes to No or No to Yes, will the previous judges lose their royalty payments. 
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                The Case Summary will review at least the top 10 pieces of evidence promoted in the evidence section for both positions and comment on the authenticity and truthfulness of each document.
              </p>
            </div>
          )}

          {activeTab === 'idea-futures' && (
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black font-sans mb-4">Ideas Futures</h1>
          
          <div className="font-bold text-black font-sans text-lg mb-4">OUTLINE</div>
          
          <div className="font-mono text-sm text-gray-900 space-y-1 leading-relaxed">
            <div className="pl-0"><strong>1. Introduction</strong></div>
            <div className="pl-0"><strong>2. Single Manipulator</strong></div>
            <div className="pl-4">1. Dynamic Vig</div>
            <div className="pl-4">2. Altered Median Redemption</div>
            <div className="pl-0"><strong>3. Multiple Manipulators</strong></div>
            <div className="pl-4">1. Max Purchase Limits</div>
            <div className="pl-4">2. KYC</div>
            <div className="pl-4">3. Median Settlement</div>
            <div className="pl-4">4. Daily Price Change Caps</div>
            <div className="pl-4">5. Threat of Fund Seizure</div>
          </div>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-black font-sans mb-3">Introduction</h2>
            <p className="text-gray-800 leading-7 mb-4">
              Idea futures align incentives to surface, evaluate, and fund research on questions that have remained unresolved for decades. By pricing hypotheses and rewarding updates toward truth,
              these markets coordinate attention and capital toward questions that matter. 
              Idea futures markets have two periods during their lifecycle:
            </p>
            
            <div className="mb-6">
              <p className="text-gray-800 leading-7 mb-3">
                The discovery period is the first phase of an idea futures market that runs for a select period of time.
                To start, the discovery period will be 5 months and during this period traders are able to buy/sell shares
                and share information in the evidence section. During the discovery period, the market collects
                all relevant information about each claim and then prices the probability that each claim is true given the information shared. 
              </p>
            </div>

            <div className="mb-6">
              <p className="text-gray-800 leading-7 mb-3">
                The settlement period begins immediately after the discovery period and runs for 
                one month. Like the discovery period, the market remains fully open to buying, 
                selling, and sharing information. The only difference is that during the settlement
                period, the median price is recorded and used to determine the final settlement price of the market.
                After the settlement period ends, the market is resolved and the payouts are distributed to the 
                traders based on the median price recorded during this period. 
              </p>
            </div>

            <div className="mb-6">
              <p className="text-gray-800 leading-7 mb-3">
                The primary problem with idea futures markets is exploitation. This paper will outline how 
                manipulators can attack the market and how the installed protocols can protect against these attacks.
              </p>
            </div>
          </section>        

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-black font-sans mb-3">Single Manipulator</h2>
            <p className="text-gray-800 leading-7 mb-4">
              A single manipulator attack is conducted by one trader who attempts to distort the
              market price to their advantage. This attack can occur during both the discovery
              and settlement period. However, it is unprofitable for the manipulator to sell their position
              prior to settlement since they would experience normal price slippage. 
            </p>
            <p className="text-gray-800 leading-7 mb-4">
              The primary strategy for a manipulator is to buy a large number of shares to increase the median price
              during the settlement period. Once the settlement period ends, the manipulator can redeem their shares at 
              a higher price per share than their average cost per share if they succeed in increasing the median price.
            </p>
            <div className="text-gray-800 leading-7">
              The section below introduces the formulas used to calculate manipulator profits and explain the assumptions made in the simulated markets.
              After the introduction to manipulation, the paper will outline the possible mitigations that can be installed to mitigate these attacks.
            </div>
          </section>

          <section className="mt-10">
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-black font-sans mb-4">Formulas</h3>
              <p className="text-gray-800 leading-7 mb-4 text-lg">
                Profit = Payout - Cost
              </p>
              
              <div className="my-4 text-xl md:text-2xl" style={{ textAlign: 'left', width: '100%' }}>
                <BlockMath>{String.raw`\text{Profit} = \big(X \cdot \text{med}(x) \cdot (1 - v)\big) - \big( C(\mathbf{q}') - C(\mathbf{q}) \big)`}</BlockMath>
              </div>
              
              <div className="my-4 text-lg md:text-xl" style={{ textAlign: 'left', width: '100%' }}>
                <BlockMath>{String.raw`\text{Profit} = \left( x \cdot \left( \frac{ e^{\frac{q_1 + x}{b}} }{ e^{\frac{q_1 + x}{b}} + e^{\frac{q_2}{b}} } \right) \cdot (1 - v) \right)
                - \left( \; b\,\ln\!\left( e^{\frac{q_1 + x}{b}} + e^{\frac{q_2}{b}} \right) \; - \; b\,\ln\!\left( e^{\frac{q_1}{b}} + e^{\frac{q_2}{b}} \right) \right)`}</BlockMath>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-black font-sans mb-4">Variables</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-800 leading-7">
                <li>X = Yes shares purchased by manipulator</li>
                <li>q₁ = Number of Yes shares purchased by other traders</li>
                <li>q₂ = Number of No shares purchased by other traders</li>
                <li>v = Vig</li>
                <li>b = Liquidity parameter</li>
              </ul>
            </div>
          </section>

          <section className="mt-10">
            <h3 className="text-xl font-bold text-black font-sans mb-4">Assumptions</h3>
            <ol className="list-decimal pl-6 space-y-3 text-gray-800 leading-7 text-base">
              <li>Two outcomes in the market.</li>
              <li>The profit-maximizing manipulator will buy one side of the market since buying the other side would damage their potential self-generated profits from the conflicting price movements.</li>
              <li>
                The maximum that an individual manipulator can affect the final median settlement price from their own price movement is the normal pricing function. In an idealized environment for a manipulator, there are no active traders during the settlement period so the manipulator will have complete control over median settlement price. As a result, the median settlement price, represented by med(x) in the payout formula, is the normal pricing function since only the manipulator can affect a price change in the idealized environment:
                <div className="mt-3 mb-3">
                  <img 
                    src="/Pricing.png" 
                    alt="Pricing Function" 
                    width="400" 
                    height="200" 
                    className="w-full max-w-md h-auto"
                  />
                </div>
              </li>
              <li>Any trades against the manipulator would drive down median settlement price, thus hurting profits from the self-generated price movement.</li>
              <li>Any trades in support of the manipulator would drive up median settlement price, but these gains would be legitimate since the added price movement is not self-generated.</li>
            </ol>
          </section>

          <section className="mt-10">
            <h3 className="text-xl font-bold text-black font-sans mb-4">How Manipulators Profit</h3>
            <p className="text-gray-800 leading-7 mb-4 text-base">
              To simulate how a manipulator can profit in an unprotected market, let&apos;s set the following market parameters:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-800 leading-7 text-base mb-4">
              <li>b = 10000 (market seed cost = $6931)</li>
              <li>q₁ = 0</li>
              <li>q₂ = 0</li>
              <li>vig = 3%</li>
            </ol>
            <p className="text-gray-800 leading-7 text-base mb-4">
              The manipulator is going to buy shares to increase the median price during the settlement period. Since it is an idealized environment,
              there are no other traders in the market so the manipulator will have complete control over the median price. Let&apos;s graph the manipulator&apos;s profits 
              as they buy more shares from the neutral market postions of q₁ & q₂ = 0.
            </p>
            

            
            <div className="mt-6 mb-4">
              <img 
                src="/ManipPro.png" 
                alt="Manipulator Profit Graph" 
                className="w-full max-w-full h-auto"
              />
            </div>
            <p className="text-gray-800 leading-7 text-base mb-4">
              When Q₁ and Q₂ are zero, the manipulator will profit any time they buy more than 1279 shares. 
              The manipulator can yield a profit of $5,040 after buying 50,995 shares which means they will drive the Yes market odds from 50% to 99.39%. 
              In an unprotected market, the market is vulnerable to manipulators and the market odds will likely not reflect the geniune beliefs of the traders.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-black font-sans mb-3">Preventing Manipulation</h2>
            <p className="text-gray-800 leading-7 mb-4 text-base">
              The following mitigations can be implemented to prevent profitable manipulation:
            </p>
            <ol className="list-decimal pl-6 space-y-3 text-gray-800 leading-7 text-base">
              <li>
                <strong>Dynamic Vig:</strong> On any profitable manipulation trade, increase the vig so that the manipulator&apos;s payout is discounted to prevent profits. At redemption, the vig needs to be calculated and applied separately for each trade.
              </li>
              <li>
                <strong>Altered Median in Redemption:</strong> The redemption price for each trader will be the median price over the settlement period minus the shares purchased by each trader. This way traders do not make money from any movement in price due to their own purchasing behavior. Traders can only make money when other traders buy their position naturally pushing the median price up.
              </li>
            </ol>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-black font-sans mb-3">Dynamic Vig</h2>
            <p className="text-gray-800 leading-7 mb-4 text-base">
              A Dynamic Vig needs to adjust to discount manipulator payouts to prevent profits from self-generated price movements.
              The updated payout formula is the normal payout formula only with a Dynamic Vig:
            </p>

            <div className="my-4 text-xl md:text-2xl" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Payout} = X \cdot \left( \frac{ e^{\frac{q_1 + x}{b}} }{ e^{\frac{q_1 + x}{b}} + e^{\frac{q_2}{b}} } \right) \cdot \big( 1 - \text{Dynamic Vig} \big)`}</BlockMath>
            </div>

            <div className="my-6 text-lg md:text-xl" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Dynamic Vig} = \frac{1}{\; \dfrac{\; b\,\ln\!\left( e^{\frac{q_1 + x}{b}} + e^{\frac{q_2}{b}} \right)\; -\; b\,\ln\!\left( e^{\frac{q_1}{b}} + e^{\frac{q_2}{b}} \right)\;}{\; X \cdot \left( \dfrac{ e^{\frac{q_1 + x}{b}} }{ e^{\frac{q_1 + x}{b}} + e^{\frac{q_2}{b}} } \right)\; }} `}</BlockMath>
            </div>

            <p className="text-gray-800 leading-7 mb-4 text-base">
              Assume the market is at the neutral market position:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-800 leading-7 text-base mb-6">
              <li>b = 10000 (market seed cost = $6,931)</li>
              <li>q₁ = 0</li>
              <li>q₂ = 0</li>
              <li>vig = 3%</li>
            </ol>

            <p className="text-gray-800 leading-7 text-base mb-4">
              Below is a graph of the how the dynamic vig increases as the manipulator purchases more shares to prevent self-generated profitable price movements:
            </p>

            <div className="mt-2 mb-6">
              <img
                src="/sha.png"
                alt="Dynamic vig schedule versus shares purchased"
                className="w-full max-w-full h-auto"
              />
            </div>
          </section>

          <section className="mt-6">
            <p className="text-gray-800 leading-7 text-base mb-4">
              When the manipulator purchases 20,000 yes shares, the Dynamic Vig will increase to 18.6% to prevent the manipulator from profiting from the price movement caused by their trade. Below are the calculations demonstrating how the dynamic vig is applied:
            </p>

            <div className="space-y-4">
              <div className="my-4 text-lg md:text-xl" style={{ textAlign: 'left', width: '100%' }}>
                <BlockMath>{String.raw`P(20000,0) = \frac{e^{\frac{20000}{10000}}}{e^{\frac{20000}{10000}} + e^{0}}`}</BlockMath>
              </div>
              <div className="my-4 text-lg md:text-xl" style={{ textAlign: 'left', width: '100%' }}>
                <BlockMath>{String.raw`\text{Profit} = \left(X \cdot P(20000,0) \cdot (1 - \text{Dynamic Vig})\right) - \left(\left(10000 \cdot \ln\left(e^{\frac{20000}{10000}} + e^{0}\right)\right) - \left(10000 \cdot \ln(2)\right)\right)`}</BlockMath>
              </div>
              <div className="my-4 text-lg md:text-xl" style={{ textAlign: 'left', width: '100%' }}>
                <BlockMath>{String.raw`\text{Profit} = \left(20000 \cdot 0.8808 \cdot (1 - 0.186)\right) - \left(\left(10000 \cdot \ln\left(e^{\frac{20000}{10000}} + e^{0}\right)\right) - \left(10000 \cdot \ln(2)\right)\right)`}</BlockMath>
              </div>
              <div className="text-gray-900 font-serif text-xl mb-4" style={{ textAlign: 'left', width: '100%' }}>
                <BlockMath>{String.raw`\text{Profit} = \$0.00`}</BlockMath>
              </div>
              <h5 className="text-xl font-bold text-black font-sans mb-3">Notes on Dynamic Vig</h5>
              <p className="text-gray-800 leading-7 text-base">
            The dynamic vig is applied when the trader is redeeming their shares. It works like a discount that the market maker applies to the trader&apos;s shares upon redemption. 
            To calculate the dynamic vig, the market maker needs to save the exact market state before and after each trade which cannot be saved on chain. 
            </p>
            </div>
          </section>
          
          {/* Removed Altered Median Price section */}

          {/* Removed Altered Median Settlement section */}
          
          <section className="mt-10">
            <h2 className="text-xl font-bold text-black font-sans mb-3">Altered Median Redemption Function</h2>
            <p className="text-gray-800 leading-7 text-base mb-4">
              The altered median redemption function prevents manipulators from profiting from their own self-generated price movements by simulating the price slippage that occurs when a trader sells their shares on the open market.
              The altered median redemption function works like the normal sale function but the cost before term is the median settlement state:  
            </p>
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Refund} = C_{\text{before}} - C_{\text{after}}`}</BlockMath>
            </div>
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`C_{\text{before}} = \text{Median Settlement State}`}</BlockMath>
            </div>
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`C_{\text{after}} = \text{Median Settlement State} - \text{Shares Purchased by Participant}`}</BlockMath>
            </div>
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Refund} = \left(10000 \cdot \ln\left(e^{\frac{\text{set}(q_1)}{b}} + e^{\frac{\text{set}(q_2)}{b}}\right)\right) - \left(10000 \cdot \ln\left(e^{\frac{\text{set}(q_1) - x_1}{b}} + e^{\frac{\text{set}(q_2)}{b}}\right)\right)`}</BlockMath>
            </div>
            <ul className="list-none pl-0 text-gray-800 leading-7 text-base space-y-2 mb-4">
              <li>set(q₁) = median settlement quantity for yes shares</li>
              <li>set(q₂) = median settlement quantity for no shares</li>
              <li>X₁ = yes shares purchased</li>
            </ul>
            <p className="text-gray-800 leading-7 text-base mb-4">
              Traders can redeem their shares for the exact amount that they could have sold them on the open market. The advantage for waiting until redemption is that the vig is not applied and this provides a small incentive for traders not to sell prior to settlement. 
            </p>
            <p className="text-gray-800 leading-7 text-base mb-4">
              Let&apos;s walk through a small example of how a manipulator cannot profit even with full control over the settlement price:
              
            </p>
            <p className="text-gray-800 leading-7 mb-4 text-base">
              Assume the market is at the neutral market position:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-800 leading-7 text-base mb-6">
              <li>b = 10000 (market seed cost = $6,931)</li>
              <li>q₁ = 0</li>
              <li>q₂ = 0</li>
              <li>vig = 3%</li>
            </ol>
          </section>
          <p className="text-gray-800 leading-7 text-base mb-4">
              The manipulator pays $23,025 to buy 29,444 yes shares and drives the yes market price to 95%. In a normal median market, the manipulator can yield a profit of $4,946 after redeeming their shares at the median price of 95 cents ($27,970 - $23,025 = $4,946). 
          </p>

          <p className="text-gray-800 leading-7 text-base mb-4">
              However in an altered median redemption market, the manipulator will not be able to profit as shown in the calculations below: 
          </p>

          <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
            <BlockMath>{String.raw`\text{Payout} = \left(10000 \cdot \ln\left(e^{\frac{29444}{10000}} + e^{\frac{0}{10000}}\right)\right) - \left(10000 \cdot \ln\left(e^{\frac{29444-29444}{10000}} + e^{0}\right)\right)`}</BlockMath>
          </div>
          <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
            <BlockMath>{String.raw`\text{Payout} = 23{,}025`}</BlockMath>
          </div>
          <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
            <BlockMath>{String.raw`\text{Cost} = 23{,}025`}</BlockMath>
          </div>
          <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
            <BlockMath>{String.raw`\text{Profit} = Payout - Cost`}</BlockMath>
          </div>
          <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
            <BlockMath>{String.raw`\text{Profit} = 23{,}025 - 23{,}025`}</BlockMath>
          </div>
          <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
            <BlockMath>{String.raw`\text{Profit} = 0`}</BlockMath>
          </div>

          <p className="text-gray-800 leading-7 text-base mb-4">
              In the altered median redemption market, the manipulator does not profit because the price effect of their trades does not increase the redemption payout.
          </p>
          <section className="mt-10">
            <h3 className="text-xl font-bold text-black font-sans mb-3">Notes on Altered Median Redemption</h3>
            <p className="text-gray-800 leading-7 text-base mb-4">
              The altered median redemption market is solvent since for every value in purchasing space, the payouts are less than the normal median redemption function due to altered median redemption function penalizing for self-generated price movements. 
            </p>
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath math="\text{Normal Redemption Function} = \text{Shares Purchased} \cdot \text{Median Settlement Price}" />
            </div>

            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath math="\text{Altered Median Redemption} = \text{Median Settlement State} - (\text{Median Settlement State} - \text{Shares Purchased by Participant})" />
            </div>

            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath math="\text{Normal Redemption Function}(q_1, q_2, x) > \text{Altered Median Redemption}(q_1, q_2, x)" />
            </div>

            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath math="X \cdot \text{med}(x) > C(\text{Median Settlement State}) - C(\text{Median Settlement State} - \text{Shares Purchased by Participant})" />
            </div>

            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath math="x \cdot \frac{e^{\frac{q_1}{b}}}{e^{\frac{q_1}{b}} + e^{\frac{q_2}{b}}} > \left( 10000 \cdot \ln\left(e^{\frac{q_1}{b}} + e^{\frac{q_2}{b}}\right) \right) - \left( 10000 \cdot \ln\left(e^{\frac{q_1 - x_1}{b}} + e^{\frac{q_2}{b}}\right) \right)" />
            </div>

            <p className="text-gray-800 leading-7 text-base mb-4">
              The inequality above can be proved for all positive values of q1, q2, and x1. Intutively, it makes sense that the normal redemption function is greater than the altered median redemption function since the altered
              median redemption function deducts price slippage, while the normal redemption function redeems the user at the median price during settlement. 
            </p>
            <p className="text-gray-800 leading-7 text-base">
              A possible problem with the altered median redemption function is how is the median settlement state determined? 
              At expiration, the market will have a certain purchase state, but traders will redeem their shares based on the median settlement state which is not the same as the purchase state at expiration. 
              As a result, the market maker faces additional potential losses in redemption since the median market state may require more payouts to traders than the purchase state at expiration. This topic will be handled in another paper. 
            </p>
          </section>

          <section className="mt-10">
          <h3 className="text-xl font-bold text-black font-sans mb-3">Conclusion on Preventing Single Trader Manipulation</h3>
          <p className="text-gray-800 leading-7 text-base">
              Altered median redemption is the best way to settle the market to prevent manipulators from profiting from their own price movements because it is easier to implement than the dynamic vig and easier to understand since it is the same function as the normal sale function used during the open market period.  
          </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-black font-sans mb-3">Multiple Manipulators</h2>
            <p className="text-gray-800 leading-7 text-base mb-4">
              A multiple manipulator attack occurs when two or more actors coordinate to move the market price in the same direction. Compared with a single trader attack, multiple manipulators can distribute purchases across identities to evade penalties from an altered median redemption market. 
              Since single trader manipulation trades result in zero profit in an altered median redemption market, multiple manipulators can profitably coordinate since the deduction applied due to the price movement is split between them. Below is an example of how multiple manipulators can profit: 
            </p>

            <p className="text-gray-800 leading-7 mb-4 text-base">
              Assume the market is at the neutral market position in an altered median redemption market:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-800 leading-7 text-base mb-6">
              <li>b = 10000 (market seed cost = $6,931)</li>
              <li>q₁ = 0</li>
              <li>q₂ = 0</li>
              <li>vig = 3%</li>
            </ol>

            <p className="text-gray-800 leading-7 mb-4 text-base">
              The manipulators will push the market price to 94% for Yes by buying between 28,000 shares in total. The first manipulator buys 14,000 shares from the neutral market state for the following price: 
            </p>
            <div className="my-4 text-base md:text-lg" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Cost Trader 1} = \left(10000 \cdot \ln\left(e^{\frac{14000}{10000}} + e^{0}\right)\right) - \left(10000 \cdot \ln(2)\right)`}</BlockMath>
            </div>
            <div className="my-4 text-base md:text-lg" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Cost Trader 1} = \$9{,}272`}</BlockMath>
            </div>
            <p className="text-gray-800 leading-7 mb-4 text-base">
              The second trader buys another 14,000 shares this time with q1 being 14,000 shares due to their partner&apos;s purchase. The cost of the second trader&apos;s purchase is below: 
            </p>
            <div className="my-4 text-base md:text-lg" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Cost Trader 2} = \left(10000 \cdot \ln\left(e^{\frac{28000}{10000}} + e^{0}\right)\right) - \left(10000 \cdot \ln\left(e^{\frac{14000}{10000}}\right)\right)`}</BlockMath>
            </div>
            <div className="my-4 text-base md:text-lg" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Cost Trader 2} = \$14{,}590`}</BlockMath>
            </div>
            <p className="text-gray-800 leading-7 mb-4 text-base">
              The traders successfully pushed the market price to 94% for Yes by spending $23,862 in total. There are no other active traders in this market and 
              94% for Yes is the median settlement price. The altered median redemption payout for each trader is below: 
            </p>
            <div className="my-4 text-base md:text-lg" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Payout Trader 1 \& 2} = \left(10000 \cdot \ln\left(e^{\frac{28000}{10000}} + e^{0}\right)\right) - \left(10000 \cdot \ln\left(e^{\frac{14000}{10000}} + e^{0}\right)\right)`}</BlockMath>
            </div>
            <div className="my-4 text-base md:text-lg" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Payout Trader 1 \& 2} = \$12{,}386`}</BlockMath>
            </div>
            <div className="my-4 text-base md:text-lg" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Total Manipulator Payout} = \$12{,}836 \times 2`}</BlockMath>
            </div>
            <div className="my-4 text-base md:text-lg" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Total Manipulator Payout} = \$24{,}772`}</BlockMath>
            </div>
            <p className="text-gray-800 leading-7 mb-4 text-base">
              Below is the Profit Calculation for the manipulators:  
            </p>
            <div className="my-4 text-base md:text-lg" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Profit Trader 1 \& 2} = \$24{,}772 - (\$9{,}272 + \$14{,}590)`}</BlockMath>
            </div>
            <div className="my-4 text-base md:text-lg" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Profit Trader 1 \& 2} = \$910`}</BlockMath>
            </div>
            <p className="text-gray-800 leading-7 mb-4 text-base">
              As demonstrated above, multiple manipulators can profitably coordinate in an altered median redemption market by splitting the deduction applied due to the price movement.   
            </p>
            <h3 className="text-xl font-bold text-black font-sans mb-3 mt-6">Preventing Multiple Manipulator Attacks</h3>
            <p className="text-gray-800 leading-7 text-base mb-4">
                There are several mitigations that can be implemented to prevent multiple manipulator attacks:
            </p>
            <ol className="list-decimal pl-6 space-y-4 text-gray-800 leading-7 text-base mb-4">
              <li>
                <strong>Max Purchase Limits:</strong> A single trader is only allowed to move the market 10%. The cumulative price impact of their trades will be tracked and no account&apos;s trades can produce a cumulative price impact greater than 10%. This can easily be enforced on the front-end and results in manipulators needing to coordinate with other real identities to carry out attacks. 
              </li>
              <li>
                <strong>KYC (Know Your Customer):</strong> Identity verification that ties each trading account to a real-world identity. KYC makes sybil attacks expensive by requiring manipulators to recruit or procure actual identities rather than creating disposable accounts. This raises the cost of coordination since each participant must be a verified individual. 
              </li>
              <li>
                <strong>Median Settlement:</strong> Settlement uses the median price over the last month of the market. 
                This means manipulators need to effect the market odds more than 50% of the time during the settlement period to have any effect on the market. Attempts to manipulate the market odds early in the settlement period provide other traders plenty of time to trade against the manipulators, confusing the desired price movement. 
              </li>
              <li>
                <strong>Daily Price Change Caps:</strong> A absolute 15% limit on total price change per market day prevents rapid price changes associated with multiple manipulator attacks. This ensures that even well-funded coalitions cannot force prices to extreme levels quickly; instead, they must sustain pressure over multiple days, giving the market time to respond. The daily cap forces manipulators to spread attacks across time, increasing both coordination complexity and the opportunity for detection.
              </li>
              <li>
                <strong>Threat of Fund Seizure:</strong> The possibility of losing funds for coordinated manipulation creates significant deterrent risk. By maintaining the authority to seize or freeze funds associated with suspicious trading patterns, the market creates asymmetric risk for manipulators—they risk losing not just their manipulation profits but their entire capital. This threat, especially when combined with KYC identity verification, makes coordinated attacks financially hazardous beyond just their execution costs.
              </li>
            </ol>
            <p className="text-gray-800 leading-7 text-base mb-4">
              Together, these five measures create friction that makes multiple manipulator attacks significantly more difficult. Coalitions must coordinate real identities, spread purchases across time and accounts, extend attacks over multiple days, and overcome settlement mechanics that average out spiky activity all while facing the threat of fund seizure.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-black font-sans mb-3">Median Payout Dynamics</h2>
            <p className="text-gray-800 leading-7 text-base mb-4">
              The market maker is exposed to additional losses when using the median settlement price since the median settlement price may be higher than the final market odds at expiration. If the median settlement price is greater than the final market odds at expiration, then the total payouts to traders is higher since the dominant side of the market is redeemed at a higher price per share. Below is an example of how median settlement markets can lead to additional losses for the market maker. 
            </p>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              Let&apos;s assume the following market parameters at closure:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-800 leading-7 text-base mb-4">
              <li>b = 10000 (market seed cost = $6,931)</li>
              <li>q₁ = 17346</li>
              <li>q₂ = 0</li>
            </ol>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              At the purchasing state described above, the market odds for the yes position are 85% and 15% for the no position. 
              If we use the final purchasing state for payouts, the market maker incurs the following losses:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Market Maker Loss} = ((\text{Yes} \cdot \text{Set(Yes)}) + (\text{No} \cdot \text{Set(No)})) - ((10000 \cdot \ln(e^{\frac{yes}{10000}} + e^{\frac{no}{10000}})) - (10000 (\ln(2)))`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Market Maker Loss} = ((17346 \cdot 0.85) + (0 \cdot 0.15)) - ((10000 \cdot \ln(e^{\frac{17346}{10000}} + e^{0})) - (10000 \cdot \ln(2)))`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Market Maker Loss} = 2704.38092754`}</BlockMath>
            </div>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              For the sake of creating a median settlement price higher than the final market odds, let&apos;s say there is a large yes share owner that sells a large position prior to market close. They held their position for the majority of the settlement period and effectively pushed the median price to 95 cents and then sold prior to settlement, causing the final market odds to drop to 85 cents. Due to the higher median settlement price, the market maker is exposed to additional losses as shown below, even though the purchasing state is the exact same at market close:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Market Maker Loss} = ((17346 \cdot 0.95) + (0 \cdot 0.05)) - ((10000 \cdot \ln(e^{\frac{17346}{10000}} + e^{0})) - (10000 \cdot \ln(2)))`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Market Maker Loss} = 4438.98092754`}</BlockMath>
            </div>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              As demonstrated above, the market maker can be exposed to additional losses as a result of using a median settlement market. Conversely, market maker losses can be mitigated as a result of using a median market when the median settlement price is below the final market odds on the dominant side of the market:
            </p>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              Let&apos;s say there is a last minute yes shares buyer who pushed the market odds to 85 cents right before the market close but the median price over the settlement period was 75 cents. The market maker would incur the following losses:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Market Maker Loss} = ((17346 \cdot 0.75) + (0 \cdot 0.25)) - ((10000 \cdot \ln(e^{\frac{17346}{10000}} + e^{0})) - (10000 \cdot \ln(2)))`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Market Maker Loss} = 969.780927539`}</BlockMath>
            </div>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              In a median settlement price market, the potential losses faced by the market maker are not bounded by b · ln(2). The maximum loss function for the market maker is unbounded and becomes the total market payout function shown below:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Market Maker Loss} = ((\text{Yes} \cdot \text{Set(Yes)}) + (\text{No} \cdot \text{Set(No)})) - ((b \cdot \ln(e^{\frac{yes}{b}} + e^{\frac{no}{b}})) - (b \cdot \ln(2)))`}</BlockMath>
            </div>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              In sum, median settlement markets expose market makers to additional losses. However, the market maker losses can be the same or less than the market maker losses in a final market odds market when the median settlement price is at or below the final market odds.
            </p>
            
            <h3 className="text-xl font-bold text-black font-sans mb-3 mt-8">Threat of Settlement</h3>
            <p className="text-gray-800 leading-7 text-base mb-4">
              A mitigation against multiple manipulators is to threaten that the market can be fully settled given either claim can be proven beyond a reasonable doubt. This increases the chance that their manipulation attack investment goes to zero. Consider the following market: 
            </p>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              Let&apos;s assume the following market parameters at closure:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-800 leading-7 text-base mb-4">
              <li>b = 10000 (market seed cost = $6,931)</li>
              <li>q₁ = 0</li>
              <li>q₂ = 29444</li>
              <li>vig = 3%</li>
              <li>Yes market odds = 5%</li>
              <li>No market odds = 95%</li>
              <li>Each trader is only allowed to move the odds by 10%, due to max purchase limits</li>
            </ol>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              The manipulators want to move the market price for the yes odds from 5% to 95%, and a cabal of 9 manipulators plan on coming together to accomplish this. Each manipulator will buy the max number of shares to move the market 10% and collectively move the yes odds from 5% to 95%. The manipulators collective profit function in an altered redemption function market is the following, given they have total control of the redemption price:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Manip Exp Profits} = (\text{Total Shares Purchased} \cdot \text{Altered Median Redemption}) - (\text{Cost of Shares})`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Manip Exp Profits} = (58888 \cdot 0.9080) - ((10000 \cdot \ln(e^{\frac{58888}{10000}} + e^{\frac{29444}{10000}})) - (10000 \cdot \ln(e^{\frac{0}{10000}} + e^{\frac{29444}{10000}})))`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Manip Exp Profits} = 24026.3`}</BlockMath>
            </div>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              After spending $29,444, the manipulators would expect to profit $24,026.3 and $2,669 on a per manipulator basis. Now let&apos;s see what the perceived threat of settlement would need to be to prevent them from executing the manipulation trades:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Manip Exp Profits} = (\text{Manip Profits} \cdot P(\text{No Settlement})) + (\text{Manip Costs} \cdot P(\text{Settlement}))`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`0 = (24026 \cdot (1 - P)) + (-29444 \cdot P)`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`P = 0.449336076304`}</BlockMath>
            </div>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              If the manipulators believed there was more than a 44.9% chance that the market would be settled, then they would not execute the manipulation trades since their expected profits would be negative.
            </p>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              Teams of manipulators can lose money because either the market was resolved in the opposite direction or their manipulation trades were liquidated and the wagered money was seized by the market maker. The effective threat of either of those events happening needs to be around 50% in order to effectively dissuade teams of manipulators at all market positions.
            </p>
            
            <h3 className="text-xl font-bold text-black font-sans mb-3 mt-8">Market Maker Profit & Loss Function</h3>
            <p className="text-gray-800 leading-7 text-base mb-4">
              The market maker profits or losses will be determined by whether the payouts to traders are greater than the total cost that traders paid to purchase their shares. Payouts to traders are reduced during the open market with the 3% standard market vig. Payouts to traders are reduced in redemption since the altered redemption formula deducts price slippage from payouts. The market maker fee functions are shown below:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Open Market Maker Fees} = \text{Open Market Sales} \cdot 0.03`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Redemption Market Maker Fees For Yes Share Purchases} = \sum_{i=1}^{n} (x_i \cdot p(x)) - ((b \cdot \ln(e^{\frac{q_1}{b}} + e^{\frac{q_2}{b}})) - (10000 \cdot \ln(e^{\frac{q_1-x_i}{b}} + e^{\frac{q_2}{b}})))`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Redemption Market Maker Fees For No Share Purchases} = \sum_{i=1}^{n} (y_i \cdot p(y)) - ((b \cdot \ln(e^{\frac{q_1}{b}} + e^{\frac{q_2}{b}})) - (10000 \cdot \ln(e^{\frac{q_1}{b}} + e^{\frac{q_2-y_i}{b}})))`}</BlockMath>
            </div>
            
            <ul className="list-disc pl-6 space-y-2 text-gray-800 leading-7 text-base mb-4">
              <li>q₁ = amount of yes shares purchased</li>
              <li>q₂ = amount of no shares purchased</li>
              <li>xᵢ = shares purchased by an individual trader</li>
              <li>yᵢ = shares purchased by an individual trader</li>
              <li>p(x) = price of yes shares</li>
              <li>p(y) = price of no shares</li>
            </ul>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              To demonstrate how the fee functions work, let&apos;s assume the following market parameters:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-800 leading-7 text-base mb-4">
              <li>B = 10000</li>
              <li>Q₁ = 10000</li>
              <li>Q₂ = 0</li>
              <li>Vig = 3%</li>
              <li>X₁ = 5000</li>
            </ul>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              Trader One(X₁) bought 5000 out of the 10000 yes shares in the market. If the trader decided to sell them in the open market, the market maker would apply the vig to the sale price and yield the following fees:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Open Market Maker Fees} = \text{Redemption Price} \cdot \text{Vig}`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Open Market Maker Fees} = ((10000 \cdot \ln(e^{\frac{10000}{10000}} + e^{\frac{0}{10000}})) - (10000 \cdot \ln(e^{\frac{5000}{10000}} + e^{\frac{0}{10000}}))) \cdot 0.03`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Open Market Maker Fees} = (3391.84703338 \cdot 0.03)`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Open Market Maker Fees} = \$101.75`}</BlockMath>
            </div>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              The market maker will gain $101.75 dollars after the trader sells their shares on the open market due to the vig. Please note that while the market maker made money on this transaction, they still face potential losses down the line due to uneven market action in redemption.
            </p>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              If the trader waits until the market is settled to redeem their shares, below is the calculation for market making fees given that there is no further purchasing activity:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Redemption Market Maker Fees on } X_1 = (X \cdot p(x)) - (((b \cdot \ln(e^{\frac{q_1}{b}} + e^{\frac{q_2}{b}}))) - (b \cdot \ln(e^{\frac{q_1-x}{b}} + e^{\frac{q_2}{b}})))`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Redemption Market Maker Fees on } X_1 = (5000 \cdot 0.73105857863) - (((10000 \cdot \ln(e^{\frac{10000}{10000}} + e^{\frac{0}{10000}}))) - (10000 \cdot \ln(e^{\frac{5000}{10000}} + e^{\frac{0}{10000}})))`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Redemption Market Maker Fees on } X_1 = 3655.29289315 - 3391.84703338`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Redemption Market Maker Fees on } X_1 = \$263.45`}</BlockMath>
            </div>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              The market maker will yield $263.45 in fees given that the trader waits until settlement to redeem their shares. The market maker losses are bounded by b · ln(2) and since the liquidity parameter is 10000, the maximum market maker loss is $6,931. The total Market Maker Profit or Loss is the loss at the final payout state less the fees collected over the course of the market.
            </p>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              Let&apos;s simulate a market where the market maker profits:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-800 leading-7 text-base mb-4">
              <li>Q₁ = 40000</li>
              <li>Q₂ = 20000</li>
              <li>Vig = 3%</li>
              <li>$20,000 in proceeds from sales on the open market</li>
              <li>Trader 1 (X₁) holds 20,000 yes shares into the settlement period</li>
              <li>Trader 2 (Y₁) holds 10,000 no shares into the settlement period</li>
            </ul>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              Now let&apos;s calculate the market maker fees given the information above.
            </p>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              First, the vig proceeds from the $20,000 in open market sales are as follows:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Open Market Maker Fees} = 20000 \cdot 0.03`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Open Market Maker Fees} = \$600`}</BlockMath>
            </div>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              Now, let&apos;s calculate the market maker fees generated from the Trader 1 (X₁) holding 20,000 yes shares into redemption:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Redemption Market Maker Fees on } X_1 = (20000 \cdot 0.880797077978) - ((10000 \cdot \ln(e^{\frac{40000}{10000}} + e^{\frac{20000}{10000}})) - (10000 \cdot \ln(e^{\frac{20000}{10000}} + e^{\frac{20000}{10000}})))`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Redemption Market Maker Fees on } X_1 = \$3{,}278`}</BlockMath>
            </div>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              Now let&apos;s calculate the market maker fees generated from Trader 2 (Y₁) holding 10,000 no shares into redemption:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Redemption Market Maker Fees on } Y_1 = (10000 \cdot 0.119202922022) - ((10000 \cdot \ln(e^{\frac{40000}{10000}} + e^{\frac{20000}{10000}})) - (10000 \cdot \ln(e^{\frac{40000}{10000}} + e^{\frac{10000}{10000}})))`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Redemption Market Maker Fees on } Y_1 = \$408.62`}</BlockMath>
            </div>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              Now let&apos;s calculate the losses that the market faces when paying out all the traders before fees are applied:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Redemption Loss} = \text{Redemption Payouts} - \text{Market Balance}`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Redemption Loss} = ((40000 \cdot 0.880797077978) + (20000 \cdot 0.119202922022)) - (34337.8083048)`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{Redemption Loss} = \$3{,}278`}</BlockMath>
            </div>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              Finally let&apos;s calculate the Market Maker Profit & Loss Function given the fees collected on trader 1, trader 2, and the open market sales:
            </p>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{P\&L} = (\text{Open Market Fees} + \text{Fees on } X_1 + \text{Fees on } Y_1) - (\text{Redemption Loss})`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{P\&L} = (600 + 3{,}278 + 408.62) - (3278)`}</BlockMath>
            </div>
            
            <div className="my-4" style={{ textAlign: 'left', width: '100%' }}>
              <BlockMath>{String.raw`\text{P\&L} = \$1{,}008.62`}</BlockMath>
            </div>
            
            <p className="text-gray-800 leading-7 text-base mb-4">
              The market maker makes $1,008.62 given the market parameters described above. Market making profitably depends entirely on market values but anytime the collected market fees are greater than the redemption loss, the market maker will profit. The smaller the average size of the share holder, the closer the market maker loss will be to the maximum bounded loss in redemption. The market maker profits in redemption from whales since it means that a large percentage of shares are redeemed below market odds.  
            </p>
          </section>
            </div>
          )}

          {activeTab === 'review-boards' && (
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black font-sans mb-4">Review Boards</h1>
              
              <h2 className="text-2xl font-bold text-black font-sans mb-3 mt-10">Judging Criteria</h2>
              <p className="text-gray-800 leading-7 mb-4">
                Each judge will categorize their final opinion in one of the following buckets:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-800 leading-7 mb-4">
                <li>No - beyond a reasonable doubt (estimated confidence of 95%)</li>
                <li>No - clear preponderance of evidence (estimated confidence of 70%)</li>
                <li>No - inconclusive for both sides (estimated confidence of less than 70%)</li>
                <li>Yes - clear preponderance of evidence (estimated confidence of 70%)</li>
                <li>Yes - beyond a reasonable doubt (estimated confidence of 95%)</li>
              </ol>
              <p className="text-gray-800 leading-7 mb-4">
                For the market to resolve &quot;Yes,&quot; two out of three judges need to rule in favor of the &quot;Yes&quot; position, meaning two out of three judges rule either &quot;Yes - clear preponderance of evidence&quot; or &quot;Yes - beyond a reasonable doubt.&quot; Any time less than two judges rules in favor of the &quot;Yes&quot; position, then the market will resolve &quot;No.&quot;
              </p>
              <p className="text-gray-800 leading-7 mb-4">
                After making their decision, the judges will author a case summary where they will review at least the top ten pieces of evidence promoted in the evidence section for each position. They will comment on the authenticity and truthfulness of each document.
              </p>

              <h2 className="text-lg md:text-xl font-bold text-black font-sans mb-3 mt-10">WSJ History Review Board</h2>
              
              <p className="text-gray-800 leading-7 mb-4">
                The Wall Street Journal appoints the members of review board based on each candidate&apos;s experience in the field and a demonstrated history of telling the truth despite potential consequences.
              </p>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-black font-sans mb-2">Dr. Robert Chen</h3>
                <p className="text-gray-800 leading-7 mb-4">
                  Dr. Chen is a Professor of American History at Stanford University, specializing in 20th-century political history and intelligence operations. With over 30 years of academic research and teaching experience, he has published extensively on Cold War era events and government institutions. Dr. Chen commits to evaluating all evidence presented in the markets with rigorous historical methodology and impartial analysis, ensuring that market resolutions reflect the most accurate interpretation of available evidence.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-black font-sans mb-2">Dr. James Mitchell</h3>
                <p className="text-gray-800 leading-7 mb-4">
                  Dr. Mitchell is a Distinguished Professor of Modern History at Columbia University, with a focus on presidential history and political scandals. Having dedicated over 30 years to historical research, he has served as a consultant for numerous historical documentaries and publications. Dr. Mitchell pledges to apply the highest standards of historical scholarship in his market evaluations, carefully weighing all evidence and testimony to reach conclusions that honor the integrity of historical truth.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-black font-sans mb-2">Dr. Michael Thompson</h3>
                <p className="text-gray-800 leading-7 mb-4">
                  Dr. Thompson is a Professor Emeritus of History at Harvard University, with expertise in space history and 20th-century technological achievements. With more than 30 years of academic service, he has authored multiple award-winning books on the space race and American technological innovation. Dr. Thompson commits to conducting thorough, unbiased reviews of all market evidence, applying decades of historical research experience to ensure that market resolutions accurately reflect the weight of historical evidence.
                </p>
              </div>

              <h2 className="text-lg md:text-xl font-bold text-black font-sans mb-3 mt-10">WSJ Scientific Review Board</h2>
              
              <p className="text-gray-800 leading-7 mb-4">
                The Wall Street Journal appoints the members of review board based on each candidate&apos;s experience in the field and a demonstrated history of telling the truth despite potential consequences.
              </p>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-black font-sans mb-2">Dr. David Anderson</h3>
                <p className="text-gray-800 leading-7 mb-4">
                  Dr. Anderson is a Professor of Public Health and Epidemiology at Johns Hopkins University, with over 30 years of experience researching population health outcomes and environmental health factors. He has published over 200 peer-reviewed articles on public health interventions and their effects on community health metrics. Dr. Anderson commits to applying rigorous scientific methodology and evidence-based analysis to all market evaluations, ensuring that resolutions are grounded in the highest standards of scientific inquiry and peer-reviewed research.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-black font-sans mb-2">Dr. Richard Martinez</h3>
                <p className="text-gray-800 leading-7 mb-4">
                  Dr. Martinez is a Professor of Immunology and Vaccine Research at the University of California, San Francisco, with more than 30 years of experience in vaccine development and safety research. He has led numerous clinical trials and served on advisory boards for major health organizations. Dr. Martinez pledges to evaluate all market evidence with the same scientific rigor he applies to his research, carefully analyzing data quality, methodology, and statistical significance to ensure market resolutions reflect the most accurate scientific consensus.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-black font-sans mb-2">Dr. Thomas Wilson</h3>
                <p className="text-gray-800 leading-7 mb-4">
                  Dr. Wilson is a Professor of Oncology and Molecular Biology at the Mayo Clinic, specializing in cancer epidemiology and the long-term health effects of medical interventions. With over 30 years of clinical and research experience, he has published extensively on cancer risk factors and treatment outcomes. Dr. Wilson commits to conducting comprehensive, objective reviews of all scientific evidence presented in markets, applying his extensive expertise to ensure that resolutions accurately represent the current state of scientific knowledge and research findings.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DocsPage() {
  return (
    <Suspense fallback={
      <div>
        <Navbar />
        <main className="min-h-screen bg-white">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="text-sm text-gray-400 font-sans mb-2">Research</div>
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              <div className="pb-2 px-1 font-sans text-lg font-semibold text-gray-500">Loading...</div>
            </div>
          </div>
        </main>
      </div>
    }>
      <DocsContent />
    </Suspense>
  );
}
