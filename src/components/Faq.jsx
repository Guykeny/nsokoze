import { useState } from 'react'

export default function Faq({ titre, surtitre, sous, questions }) {
  const [ouverte, setOuverte] = useState(null)

  function basculer(i) {
    setOuverte((prev) => (prev === i ? null : i))
  }

  return (
    <section className="section faq-section">
      <p className="surtitre" style={{ textAlign: 'center' }}>{surtitre}</p>
      <h2 className="section-titre" style={{ textAlign: 'center' }}>{titre}</h2>
      {sous && <p className="section-sous" style={{ textAlign: 'center', margin: '0 auto 26px' }}>{sous}</p>}

      <div className="faq-liste">
        {questions.map((q, i) => {
          const ouvert = ouverte === i
          return (
            <div key={i} className={`faq-item ${ouvert ? 'ouvert' : ''}`}>
              <button
                className="faq-question"
                onClick={() => basculer(i)}
                aria-expanded={ouvert}
              >
                <span>{q.q}</span>
                <span className="faq-icone" aria-hidden="true">{ouvert ? '−' : '+'}</span>
              </button>
              {ouvert && <div className="faq-reponse">{q.r}</div>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
