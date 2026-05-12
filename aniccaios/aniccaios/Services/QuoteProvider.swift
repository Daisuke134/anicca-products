import Foundation

/// Affirmation quote with stable id (for notification deep-link).
struct Quote: Identifiable, Codable, Hashable {
    let id: String
    let text: String
}

/// 100 EN + 100 JA verbatim affirmations from established sources.
/// EN: Louise Hay (louisehay.com/affirmations) + Develop Good Habits (developgoodhabits.com/positive-affirmations).
/// JA: i.am app (verified App Store screenshots) + 玉野湖太 (note.com/tamano_tora).
/// Pool source: docs/data/affirmation-pool-v1.json — single source of truth.
final class QuoteProvider {
    static let shared = QuoteProvider()
    private init() {}

    /// All quotes for the current language preference.
    func all(preferredLanguage: LanguagePreference = LanguagePreference.detectDefault()) -> [Quote] {
        switch preferredLanguage {
        case .ja: return Self.ja
        case .en, .de, .fr, .es, .ptBR: return Self.en
        }
    }

    /// Look up a quote by id.
    func byId(_ id: String, preferredLanguage: LanguagePreference = LanguagePreference.detectDefault()) -> Quote? {
        return all(preferredLanguage: preferredLanguage).first { $0.id == id }
    }

    /// Today's quote (day-of-year mod 100). Used by legacy talk screen.
    func todayQuote(preferredLanguage: LanguagePreference, date: Date, calendar: Calendar = .current) -> String {
        let pool = all(preferredLanguage: preferredLanguage)
        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: date) ?? 1
        let index = (dayOfYear - 1) % pool.count
        return pool[index].text
    }

    func todayQuote() -> String {
        return todayQuote(preferredLanguage: LanguagePreference.detectDefault(), date: Date())
    }

    /// Pick N quote IDs for today's 4-daily notifications (evenly spaced in pool).
    func todayNotificationIds(count: Int = 4, preferredLanguage: LanguagePreference = LanguagePreference.detectDefault(), date: Date = Date(), calendar: Calendar = .current) -> [String] {
        let pool = all(preferredLanguage: preferredLanguage)
        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: date) ?? 1
        let stride = pool.count / count
        let base = (dayOfYear - 1) % pool.count
        return (0..<count).map { pool[(base + $0 * stride) % pool.count].id }
    }

    // MARK: - Static pools (100 each, verbatim from verified sources)

    private static let en: [Quote] = [
        Quote(id: "q001", text: "Abundance flows freely through me."),
        Quote(id: "q002", text: "All that I need to know at any given moment is revealed to me. My intuition is always on my side."),
        Quote(id: "q003", text: "As I forgive myself, it becomes easier to forgive others."),
        Quote(id: "q004", text: "Every decision I make is the right one for me."),
        Quote(id: "q005", text: "Every experience I have is perfect for my growth."),
        Quote(id: "q006", text: "Every person, place, and thing on this planet is interconnected with love. I am at home in the Universe."),
        Quote(id: "q007", text: "Everything in my life works now and forevermore."),
        Quote(id: "q008", text: "I accept my power."),
        Quote(id: "q009", text: "I am a joyful breeze entering a room."),
        Quote(id: "q010", text: "I am an open channel for creative ideas."),
        Quote(id: "q011", text: "I am beautiful, and everybody loves me."),
        Quote(id: "q012", text: "I am grateful for my healthy body. I love life."),
        Quote(id: "q013", text: "I am in perfect health."),
        Quote(id: "q014", text: "I am one with the very Power that created me."),
        Quote(id: "q015", text: "I am pain free and totally in sync with life."),
        Quote(id: "q016", text: "I am patient, tolerant, and diplomatic."),
        Quote(id: "q017", text: "I am safe."),
        Quote(id: "q018", text: "I am surrounded by love."),
        Quote(id: "q019", text: "I am surrounded by love. All is well."),
        Quote(id: "q020", text: "I am the only person who has control over my eating habits. I can always resist something if I choose to."),
        Quote(id: "q021", text: "I am unlimited in my wealth. All areas of my life are abundant and fulfilling."),
        Quote(id: "q022", text: "I am worth loving. There is love all around me."),
        Quote(id: "q023", text: "I deserve the best, and I accept it now. All my needs and desires are met before I even ask."),
        Quote(id: "q024", text: "I draw love and acceptance into my life, and I accept it now."),
        Quote(id: "q025", text: "I feel glorious, dynamic energy. I am active and alive."),
        Quote(id: "q026", text: "I feel safe in the rhythm and flow of ever-changing life."),
        Quote(id: "q027", text: "I flow easily with new experiences, new challenges, and new people who enter my life."),
        Quote(id: "q028", text: "I forgive everyone in my past for all perceived wrongs. I release them with love."),
        Quote(id: "q029", text: "I forgive myself and set myself free."),
        Quote(id: "q030", text: "I go beyond barriers to possibilities."),
        Quote(id: "q031", text: "I handle my own life with joy and ease."),
        Quote(id: "q032", text: "I look within to find my treasures."),
        Quote(id: "q033", text: "I love every cell of my body."),
        Quote(id: "q034", text: "I now choose to release all hurt and resentment."),
        Quote(id: "q035", text: "I now free myself from destructive fears and doubts."),
        Quote(id: "q036", text: "I open my heart and sing the joys of love."),
        Quote(id: "q037", text: "I rejoice in the love I encounter every day."),
        Quote(id: "q038", text: "I see my parents as tiny children who need love."),
        Quote(id: "q039", text: "I take brisk walks in the sunshine to invigorate my body and soul."),
        Quote(id: "q040", text: "I take in and give out nourishment in perfect balance."),
        Quote(id: "q041", text: "I want -- it’s an excellent way to attract happiness in my life."),
        Quote(id: "q042", text: "Life brings me only good experiences. I am open to new and wonderful changes."),
        Quote(id: "q043", text: "Love is powerful--your love and my love."),
        Quote(id: "q044", text: "My body takes me everywhere easily and effortlessly."),
        Quote(id: "q045", text: "My day begins and ends with gratitude and joy."),
        Quote(id: "q046", text: "My heart is open. I speak with loving words."),
        Quote(id: "q047", text: "My income is constantly increasing."),
        Quote(id: "q048", text: "My life is joyously balanced with work and play."),
        Quote(id: "q049", text: "My mind and body are in perfect balance. I am a harmonious being."),
        Quote(id: "q050", text: "Nourishing Myself Is A Joyful Experience, And I Am Worth The Time Spent On My Healing."),
        Quote(id: "q051", text: "This is a new day! I begin anew and claim and create all that is good."),
        Quote(id: "q052", text: "Today I create a wonderful new day and a wonderful new future."),
        Quote(id: "q053", text: "Today I listen to my feelings, and I am gentle with myself. I know that all of my feelings are my friends."),
        Quote(id: "q054", text: "Today is going to be a really, really good day."),
        Quote(id: "q055", text: "Today is the future I created yesterday."),
        Quote(id: "q056", text: "We are all family, and the planet is our home."),
        Quote(id: "q057", text: "Wellness is the natural state of my body. I believe in perfect health."),
        Quote(id: "q058", text: "dgh extracted: 100."),
        Quote(id: "q059", text: "I am avoiding excessive carbs."),
        Quote(id: "q060", text: "I am a winner."),
        Quote(id: "q061", text: "I am not afraid to be wrong."),
        Quote(id: "q062", text: "I am confident in the presence of others."),
        Quote(id: "q063", text: "I am loved, and I am wanted."),
        Quote(id: "q064", text: "I am grateful for the things I have."),
        Quote(id: "q065", text: "I am committed to becoming the person I will become."),
        Quote(id: "q066", text: "I am my own best chance for success."),
        Quote(id: "q067", text: "I am constantly improving."),
        Quote(id: "q068", text: "I am not dependent on anyone else."),
        Quote(id: "q069", text: "I am happy, healthy, and centered."),
        Quote(id: "q070", text: "I am content."),
        Quote(id: "q071", text: "I am unique and a gift to the world."),
        Quote(id: "q072", text: "I am a positive influence, and I surround myself with others like me."),
        Quote(id: "q073", text: "I am calm and confident."),
        Quote(id: "q074", text: "I am worthy of financial stability."),
        Quote(id: "q075", text: "I am open-minded and willing to explore any path to success."),
        Quote(id: "q076", text: "I am fully committed to achieving success in my life."),
        Quote(id: "q077", text: "I am prepared for the challenges of the day."),
        Quote(id: "q078", text: "I am energized by the thought of a new day."),
        Quote(id: "q079", text: "I believe I can lose weight."),
        Quote(id: "q080", text: "I have the power to control my weight through healthy eating and exercise."),
        Quote(id: "q081", text: "I have faith in my."),
        Quote(id: "q082", text: "I will speak with confidence and self-assurance."),
        Quote(id: "q083", text: "I will say “No” when I do not have the time or inclination to act."),
        Quote(id: "q084", text: "I dare to be different."),
        Quote(id: "q085", text: "I do not need other people for happiness."),
        Quote(id: "q086", text: "I choose hope over fear."),
        Quote(id: "q087", text: "I will not take other people's negativity personally."),
        Quote(id: "q088", text: "I am a diamond. It is time for me to shine."),
        Quote(id: "q089", text: "I am a magnet for love."),
        Quote(id: "q090", text: "I will stop apologizing for being myself."),
        Quote(id: "q091", text: "I do not bow to my fears."),
        Quote(id: "q092", text: "I will achieve all of my goals."),
        Quote(id: "q093", text: "I set clear goals and work to complete them every day."),
        Quote(id: "q094", text: "I have a plan of action to achieve my desires."),
        Quote(id: "q095", text: "I only set goals that matter."),
        Quote(id: "q096", text: "I will master distractions and keep my focus on my goals."),
        Quote(id: "q097", text: "I must rely upon myself."),
        Quote(id: "q098", text: "I will accept nothing but the best."),
        Quote(id: "q099", text: "I desire to learn new things."),
        Quote(id: "q100", text: "I have a growth mindset."),
    ]

    private static let ja: [Quote] = [
        Quote(id: "q001", text: "私は今のままで充分です。"),
        Quote(id: "q002", text: "私には美しい心と魂があります。"),
        Quote(id: "q003", text: "物事は必要な形でうまくいく。"),
        Quote(id: "q004", text: "私は、なりつつある自分にわくわくしている。"),
        Quote(id: "q005", text: "私は愛と尊重を受けるに値する。"),
        Quote(id: "q006", text: "私は毎日、豊かになっています。"),
        Quote(id: "q007", text: "私は毎日、どんどん幸せになっていきます。"),
        Quote(id: "q008", text: "私は自分の感情をすべて受け入れます。"),
        Quote(id: "q009", text: "私は人生を思うように生きています。"),
        Quote(id: "q010", text: "私はいつも明るく笑顔です。"),
        Quote(id: "q011", text: "私はなんて幸せなんだろう。"),
        Quote(id: "q012", text: "私は幸せ者です。"),
        Quote(id: "q013", text: "私は毎日、あらゆる点でよくなっています。"),
        Quote(id: "q014", text: "私は必要なものを、すべて持っています。"),
        Quote(id: "q015", text: "私は自分に自信を持っている。"),
        Quote(id: "q016", text: "私は人を許せる。"),
        Quote(id: "q017", text: "私はチャンスに恵まれている。"),
        Quote(id: "q018", text: "私は日々、あらゆる面でよくなりつつある。"),
        Quote(id: "q019", text: "私はいつでも愛を感じています。"),
        Quote(id: "q020", text: "私はチャンスに愛されています。"),
        Quote(id: "q021", text: "私は今現在、余りにも幸せで感謝しています。人生の良きもの全てを受け取っています。"),
        Quote(id: "q022", text: "私は宇宙の力を信じています。宇宙が人生に与えてくれるもの全てを受け入れます。"),
        Quote(id: "q023", text: "私は運がいい。"),
        Quote(id: "q024", text: "私はありのままの自分を受け入れ、愛しています。"),
        Quote(id: "q025", text: "私は全ての出来事をチャンスに変える事ができます。"),
        Quote(id: "q026", text: "私は、豊かに成長し続けています。"),
        Quote(id: "q027", text: "私は常に成功している。"),
        Quote(id: "q028", text: "私はいつも明るくほがらかです。"),
        Quote(id: "q029", text: "私はいつも堂々としている。"),
        Quote(id: "q030", text: "私は心がオープンです、ありがとうございます。"),
        Quote(id: "q031", text: "私は人を許すことができます、ありがとうございます。"),
        Quote(id: "q032", text: "私は自分の能力を信じています。"),
        Quote(id: "q033", text: "私は日々進歩し、才能が拡大しています。そのことを誇らしく思っています。"),
        Quote(id: "q034", text: "私は私に必要なものをすべて持っています。"),
        Quote(id: "q035", text: "私は毎日感動しています。"),
        Quote(id: "q036", text: "私は毎日ワクワク過ごしている。"),
        Quote(id: "q037", text: "私はいつもリラックス、いつも笑顔です。"),
        Quote(id: "q038", text: "私は影響力を持っていて、とても貴重な存在である。"),
        Quote(id: "q039", text: "私はいつもうまくやれる。"),
        Quote(id: "q040", text: "私は大きな人間であり、もっと多くのことができる。もっと多くを手にすることができる。"),
        Quote(id: "q041", text: "私はやさしい心で満たされた心豊かな毎日を心地よくすごしている。"),
        Quote(id: "q042", text: "私は自分の人生に、生まれてきたことに感謝し満足している。"),
        Quote(id: "q043", text: "私はこの世のものでも見えない世界のものでも、自分と調和した物事を引き寄せることを望む。"),
        Quote(id: "q044", text: "私は毎日、たくさんの知識を吸収し発展していく自分が誇らしいです。"),
        Quote(id: "q045", text: "私は見えない世界の事柄の基盤は純粋で前向きなエネルギーであることを理解している。"),
        Quote(id: "q046", text: "私は成長したいと願う存在であり、成長と拡大が自然であるばかりでなく不可避であることがとても楽しい。"),
        Quote(id: "q047", text: "私はありあまる富を手に入れました、ありがとうございます。"),
        Quote(id: "q048", text: "私は余りあるほどのお金を持っています、ありがとうございます。"),
        Quote(id: "q049", text: "私はお金が大好きで、お金も私が大好きです。"),
        Quote(id: "q050", text: "私はお金を引き寄せる磁石です。"),
        Quote(id: "q051", text: "私はいつもお金には余裕があります。"),
        Quote(id: "q052", text: "私は欲しい物は何でも買う余裕があります。"),
        Quote(id: "q053", text: "私は高い報酬を得ています。"),
        Quote(id: "q054", text: "私は人生で出会うすべてのお金に感謝します。"),
        Quote(id: "q055", text: "私はいつも十二分なお金を持っています。"),
        Quote(id: "q056", text: "私は自分の収入が無限であると知っています。"),
        Quote(id: "q057", text: "私はお金に価値があることを理解しています。お金は自由をもたらします。"),
        Quote(id: "q058", text: "私はお金を手にすると喜びを感じます。私はお金も心もすべてはエネルギーであることを理解しています。"),
        Quote(id: "q059", text: "私は豊かさは無限であることを知っています。"),
        Quote(id: "q060", text: "私は豊かさを手にする価値があることを確信しています。"),
        Quote(id: "q061", text: "私は自分の利益と、私の心の富に感謝します。"),
        Quote(id: "q062", text: "私はお金持ちに相応しい人間です。私にはお金持ちになる権利があります。お金持ちになる運命にあります。"),
        Quote(id: "q063", text: "私は遊んでいてもお金持ちになれる運命です。"),
        Quote(id: "q064", text: "私はお金が大好きで、お金にいつも感謝しています。"),
        Quote(id: "q065", text: "私はお金を手に入れて、豊かさと繁栄を楽しんでいます。"),
        Quote(id: "q066", text: "私は遊んでいてもお金が舞い込んでくる。"),
        Quote(id: "q067", text: "私は経済的な繁栄を望む。"),
        Quote(id: "q068", text: "私は好きなことをしているだけで、たくさんのお金が入ってきます。"),
        Quote(id: "q069", text: "私はお金に愛され、お金も私を愛しています。"),
        Quote(id: "q070", text: "私は大好きなことを仕事にしていて、一緒に働いてくれている仲間たちに日々感謝しています。"),
        Quote(id: "q071", text: "私は自分の大好きな仕事で世の中に大きな価値を提供していることを誇らしく思い、感謝しています。"),
        Quote(id: "q072", text: "私は常に進歩していて、ますます大きな喜びと価値を社会に提供している。"),
        Quote(id: "q073", text: "私は仕事とお金に関連がないことを理解していて、私が何をしていようとお金は勝手に流れ込んでくる。"),
        Quote(id: "q074", text: "私はお金を自由に使い、ワクワクしてとても楽しい充実した毎日を送っている。"),
        Quote(id: "q075", text: "私はお金が自分を気分よくさせてくれるものだということを知っている。"),
        Quote(id: "q076", text: "私はお金を完璧に支配していて、お金が私のところに最大限に流れ込んでくる方法を知っている。"),
        Quote(id: "q077", text: "私はずっと愛せる人と出会って、幸せに暮らしています。"),
        Quote(id: "q078", text: "私は魅力がさらに増し、私にぴったりの素敵な人と出会いました。"),
        Quote(id: "q079", text: "私は異性と楽しく過ごし、愛されるに相応しい存在です。"),
        Quote(id: "q080", text: "私は異性から無条件にチヤホヤされる魅力的な女性(男性)です。"),
        Quote(id: "q081", text: "私は理想の恋人に出会いました、ありがとうございます。"),
        Quote(id: "q082", text: "私はなぜか分かりませんが、ひたすらにモテます。"),
        Quote(id: "q083", text: "私は生まれつきモテます、ありがとうございます。"),
        Quote(id: "q084", text: "私は幸せを引き寄せる体質なので、この恋愛もどんどん発展しています。"),
        Quote(id: "q085", text: "私は一生を共にしたいと思える、かけがえのない人に出会って本当に幸せです。"),
        Quote(id: "q086", text: "私は私らしくいる今がもっとも魅力的で、私でいることで誰からも愛される。"),
        Quote(id: "q087", text: "私はとてもステキな人たちに囲まれて暮らしていて、毎日が幸せです。"),
        Quote(id: "q088", text: "私は魅力的な人間です。みんなから好かれていて、毎日楽しく笑顔で過ごしています。"),
        Quote(id: "q089", text: "私は最高の仲間に囲まれていてとても幸せです、ありがとうございます。"),
        Quote(id: "q090", text: "私は一流の人財に囲まれています、ありがとうございます。"),
        Quote(id: "q091", text: "私は協力的で心温かい常識のある隣人に恵まれています。"),
        Quote(id: "q092", text: "私はよい人脈に恵まれている。"),
        Quote(id: "q093", text: "私はみんなから愛されています、ありがとうございます。"),
        Quote(id: "q094", text: "私は誰からも愛されています、ありがとうございます。"),
        Quote(id: "q095", text: "私は誰からも信頼されています、ありがとうございます。"),
        Quote(id: "q096", text: "私はどんな人も受け入れることができる大きな器の人間である。"),
        Quote(id: "q097", text: "私は今日も世界にポジティブな変化を起こす、そしてそんな仲間がどんどん集まってくる。"),
        Quote(id: "q098", text: "私は無条件で、暖かい尊敬の念を全ての人に対してもっている。"),
        Quote(id: "q099", text: "私は心からの感謝の念を日々周囲に伝えている。"),
        Quote(id: "q100", text: "私は愛し、愛されている。"),
    ]
}
