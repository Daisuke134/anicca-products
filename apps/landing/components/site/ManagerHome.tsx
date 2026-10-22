import "./manager-home.css";

// Public copy and conceptual artwork from the approved bilingual website design.
export default function ManagerHome({ locale }: { locale: "en" | "ja" }) {
  return locale === "ja" ? (
    <div className="manager-home ja" lang="ja">
      <div className="wrap">
        <header>
          <a className="brand" href="#">
            Anicca
          </a>
          <nav aria-label="主な項目">
            <a className="" href="#vision">
              構想
            </a>
            <a className="optional" href="#loop">
              仕組み
            </a>
            <a className="" href="#evidence">
              検証
            </a>
            <a className="" href="#research">
              研究
            </a>
            <a className="language" href="/en">
              EN
            </a>
          </nav>
        </header>
        <main>
          <div className="hero">
            <div className="eyebrow">
              <span className="dot" aria-hidden="true"></span>
              開発している人工知能
            </div>
            <div className="hero-grid">
              <div>
                <h1>マネージャー。</h1>
                <p className="tagline">ひとつの存在、すべてに恩恵を。</p>
                <p className="lead">
                  世界を理解し、環境を変え、現実から学ぶ。すべての生命が豊かに生きられる世界を目指す人工知能。
                </p>
                <div className="links">
                  <a className="button" href="#vision">
                    構想を読む ↓
                  </a>
                  <a className="text-link" href="#evidence">
                    現在の進捗を見る ↗
                  </a>
                </div>
              </div>
              <figure>
                <img
                  className="universe"
                  src="/manager/universe-ja.svg"
                  alt="宇宙を表す概念図。観測した世界の状態を示す図ではありません。"
                  width="500"
                  height="500"
                />
              </figure>
            </div>
            <div className="hero-foot">
              <span>すべての生命</span>
              <span>宇宙規模の構想</span>
              <span>測定できる進歩</span>
            </div>
          </div>
          <section id="vision">
            <div className="section-label">01 / 構想</div>
            <div className="split">
              <h2>
                すべての生命に、
                <br />
                よりよい環境を。
              </h2>
              <div>
                <p className="big-copy">
                  宇宙には、よりよいマネージャーが必要です。
                </p>
                <p className="body-copy">
                  資源、利用の機会、供給、制度、生態系。生命の暮らしを形づくる環境を、改善の対象として考えます。効果の見込める変更を見つけ、変更できる範囲から実行し、その後に起きた現実から学ぶ仕組みを目指します。
                </p>
                <p className="body-copy">
                  最初に取り組むのは、証拠の整理、人口モデル、独立した評価です。確かめた能力を積み重ね、対象を広げていきます。
                </p>
              </div>
            </div>
          </section>
          <section id="loop">
            <div className="section-label">02 / 仕組み</div>
            <div className="split">
              <h2>
                理解し、変え、
                <br />
                結果から学ぶ。
              </h2>
              <p className="body-copy">
                観測から判断へ、判断から行動へ。実際の結果を確かめ、次の判断へつなげます。
              </p>
            </div>
            <div className="loop">
              <article>
                <b>01</b>
                <h3>観測する</h3>
                <p>根拠を集め、分かっていない部分も記録する。</p>
              </article>
              <article>
                <b>02</b>
                <h3>モデル化する</h3>
                <p>人口、環境、それらの相互作用を表す。</p>
              </article>
              <article>
                <b>03</b>
                <h3>比較する</h3>
                <p>変更候補ごとに、その後の変化を予測する。</p>
              </article>
              <article>
                <b>04</b>
                <h3>実行する</h3>
                <p>変更を適用し、実際に変わったことを別に確認する。</p>
              </article>
              <article>
                <b>05</b>
                <h3>学ぶ</h3>
                <p>結果、費用、不確実性、失敗を測り、改善する。</p>
              </article>
            </div>
          </section>
          <section id="evidence">
            <div className="dark">
              <div className="section-label">03 / 検証</div>
              <h2>
                大きな構想を、
                <br />
                確かめられる進歩に。
              </h2>
              <p>
                長期の目標と、測定できた能力を区別します。現在は最初の人口・評価部品を開発するための設計と調査を進めています。現実の生活を改善した効果は、まだ実証していません。
              </p>
              <div className="ledger">
                <div className="ledger-row">
                  <strong>人口と評価</strong>
                  <span>仕様、出典の調査、学習用の分離実行。</span>
                  <span className="status">実装予定</span>
                </div>
                <div className="ledger-row">
                  <strong>反応予測と介入</strong>
                  <span>行動モデル、環境変更、独立評価。</span>
                  <span className="status">調査・設計</span>
                </div>
                <div className="ledger-row">
                  <strong>現実の成果</strong>
                  <span>健康、生活、経済的な豊かさへの効果。</span>
                  <span className="status">未測定</span>
                </div>
              </div>
            </div>
          </section>
          <section id="research">
            <div className="section-label">04 / 研究</div>
            <div className="split">
              <h2>
                先行研究に学び、
                <br />
                確かめながらつくる。
              </h2>
              <p className="body-copy">
                人口合成、行動予測、社会シミュレーション、因果評価、人工知能の仕組みの研究をつなげます。研究の解説と、再現できる実験結果を、開発とともに蓄積していきます。
              </p>
            </div>
          </section>
          <section className="closing">
            <h2>すべての生命のために。</h2>
            <p>ひとつの存在、すべてに恩恵を。</p>
          </section>
        </main>
        <footer>
          <span>© 2026 マネージャー</span>
          <a href="mailto:contact@aniccaai.com">contact@aniccaai.com</a>
        </footer>
      </div>
    </div>
  ) : (
    <div className="manager-home en" lang="en">
      <div className="wrap">
        <header>
          <a className="brand" href="#">
            Anicca
          </a>
          <nav aria-label="Main navigation">
            <a className="" href="#vision">
              Vision
            </a>
            <a className="optional" href="#loop">
              How it works
            </a>
            <a className="" href="#evidence">
              Evidence
            </a>
            <a className="" href="#research">
              Research
            </a>
            <a className="language" href="/ja">
              JA
            </a>
          </nav>
        </header>
        <main>
          <div className="hero">
            <div className="eyebrow">
              <span className="dot" aria-hidden="true"></span>INTRODUCING
            </div>
            <div className="hero-grid">
              <div>
                <h1>Manager.</h1>
                <p className="tagline">One entity, blessing for all.</p>
                <p className="lead">
                  Understand the world. Change its conditions. Learn from
                  reality. We are building AI to improve the conditions of life
                  for all living beings.
                </p>
                <div className="links">
                  <a className="button" href="#vision">
                    Explore the vision ↓
                  </a>
                  <a className="text-link" href="#evidence">
                    See our progress ↗
                  </a>
                </div>
              </div>
              <figure>
                <img
                  className="universe"
                  src="/manager/universe.svg"
                  alt="A conceptual illustration of the universe, not an observed world-state map."
                  width="500"
                  height="500"
                />
              </figure>
            </div>
            <div className="hero-foot">
              <span>All living beings</span>
              <span>Universe-scale ambition</span>
              <span>Measurable progress</span>
            </div>
          </div>
          <section id="vision">
            <div className="section-label">01 / Vision</div>
            <div className="split">
              <h2>
                Better conditions.
                <br />
                For every form of life.
              </h2>
              <div>
                <p className="big-copy">
                  The universe deserves a better manager.
                </p>
                <p className="body-copy">
                  We aim to improve the conditions that shape life: access,
                  supply, shared resources, institutions, and ecosystems.
                  Manager is designed to discover useful changes, act within the
                  systems it can change, and learn from what actually happens.
                </p>
                <p className="body-copy">
                  We begin with evidence, population models, and independent
                  evaluation. Each verified capability is a step toward a
                  broader ambition.
                </p>
              </div>
            </div>
          </section>
          <section id="loop">
            <div className="section-label">02 / How it works</div>
            <div className="split">
              <h2>
                Understand. Change.
                <br />
                Learn. Repeat.
              </h2>
              <p className="body-copy">
                One continuous process, connecting observations to decisions and
                decisions to measured outcomes.
              </p>
            </div>
            <div className="loop">
              <article>
                <b>01</b>
                <h3>Observe</h3>
                <p>Gather evidence and record what remains unknown.</p>
              </article>
              <article>
                <b>02</b>
                <h3>Model</h3>
                <p>
                  Represent populations, environments, and their interactions.
                </p>
              </article>
              <article>
                <b>03</b>
                <h3>Compare</h3>
                <p>Predict the consequences of possible changes.</p>
              </article>
              <article>
                <b>04</b>
                <h3>Act</h3>
                <p>Apply a change and independently verify what happened.</p>
              </article>
              <article>
                <b>05</b>
                <h3>Learn</h3>
                <p>Measure outcomes, costs, uncertainty, and failures.</p>
              </article>
            </div>
          </section>
          <section id="evidence">
            <div className="dark">
              <div className="section-label">03 / Evidence</div>
              <h2>
                A transparent ambition.
                <br />
                Evidence you can inspect.
              </h2>
              <p>
                We distinguish our long-term ambition from the capabilities we
                have measured. We are developing the first population and
                evaluation components; real-world improvements have not yet been
                demonstrated.
              </p>
              <div className="ledger">
                <div className="ledger-row">
                  <strong>Population and evaluation</strong>
                  <span>
                    Specifications, source studies, and isolated learning
                    exercises.
                  </span>
                  <span className="status">IMPLEMENTATION PLANNED</span>
                </div>
                <div className="ledger-row">
                  <strong>Behavior and intervention</strong>
                  <span>
                    Models, environment changes, and independent assessment.
                  </span>
                  <span className="status">RESEARCH & DESIGN</span>
                </div>
                <div className="ledger-row">
                  <strong>Real-world outcomes</strong>
                  <span>
                    Effects on health, wellbeing, or financial security.
                  </span>
                  <span className="status">NOT YET MEASURED</span>
                </div>
              </div>
            </div>
          </section>
          <section id="research">
            <div className="section-label">04 / Research</div>
            <div className="split">
              <h2>
                Learn the field.
                <br />
                Build on evidence.
              </h2>
              <p className="body-copy">
                Our work connects population synthesis, human behavior modeling,
                social simulation, causal evaluation, and the study of AI
                mechanisms. Research explanations and reproducible results will
                accompany development.
              </p>
            </div>
          </section>
          <section className="closing">
            <h2>For every form of life.</h2>
            <p>One entity, blessing for all.</p>
          </section>
        </main>
        <footer>
          <span>© 2026 Manager</span>
          <a href="mailto:contact@aniccaai.com">contact@aniccaai.com</a>
        </footer>
      </div>
    </div>
  );
}
