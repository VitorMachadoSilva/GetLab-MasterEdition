from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


OUTPUT = "output/pdf/roteiro-falas-getlab.pdf"


slides = [
    {
        "title": "Slide 1 - Capa",
        "time": "30 segundos",
        "speech": (
            "Boa noite. Nosso projeto se chama GetLab, um sistema web para gerenciamento "
            "e reserva de laboratorios. Ele foi desenvolvido para melhorar a organizacao "
            "dos ambientes academicos da FMP, facilitando o processo tanto para docentes "
            "quanto para administradores."
        ),
    },
    {
        "title": "Slide 2 - Justificativa",
        "time": "1 minuto",
        "speech": (
            "A justificativa do projeto esta na dificuldade de controlar reservas de "
            "laboratorios de forma manual ou descentralizada. Quando nao existe uma "
            "plataforma unica para isso, podem ocorrer conflitos de horario, falta de "
            "transparencia e perda de tempo no planejamento das aulas. O GetLab surge "
            "para centralizar esse fluxo, tornando as solicitacoes mais organizadas, "
            "rastreaveis e faceis de acompanhar."
        ),
    },
    {
        "title": "Slide 3 - Objetivo",
        "time": "1 minuto",
        "speech": (
            "O objetivo geral do GetLab e aprimorar o gerenciamento de reservas de "
            "laboratorios por meio de uma plataforma web intuitiva, segura e responsiva. "
            "Entre os objetivos especificos estao permitir que docentes solicitem "
            "reservas, validar conflitos de data e horario, apoiar a aprovacao pelo "
            "administrador, exibir reservas aprovadas em um display publico e melhorar "
            "a transparencia do processo."
        ),
    },
    {
        "title": "Slide 4 - Fundamentacao",
        "time": "1 minuto",
        "speech": (
            "A fundamentacao do projeto esta relacionada a tres pontos principais: "
            "gestao de recursos em ambientes educacionais, uso de tecnologias da "
            "informacao na educacao e desenvolvimento agil de software. A proposta "
            "e substituir processos manuais por uma solucao digital que aumente a "
            "eficiencia, a previsibilidade e a organizacao no uso dos laboratorios."
        ),
    },
    {
        "title": "Slide 5 - Metodologia",
        "time": "1 minuto",
        "speech": (
            "A metodologia seguiu uma abordagem aplicada e incremental. Primeiro foi "
            "feita uma analise da versao anterior do GetLab. Depois levantamos pontos "
            "de melhoria, revisamos regras de negocio e ajustamos os fluxos principais "
            "do sistema. O desenvolvimento foi feito por etapas, com validacoes visuais, "
            "funcionais e de responsividade ao longo do processo."
        ),
    },
    {
        "title": "Slide 6 - Desenvolvimento",
        "time": "1 minuto antes da demonstracao",
        "speech": (
            "No desenvolvimento, o GetLab foi estruturado como uma aplicacao web com "
            "autenticacao, banco de dados e regras especificas por perfil. O professor "
            "realiza solicitacoes de reserva, o administrador aprova ou rejeita essas "
            "solicitacoes, e o display publico mostra apenas as reservas aprovadas. "
            "A arquitetura utiliza tecnologias como Next.js, React, TypeScript, Prisma, "
            "PostgreSQL e NextAuth."
        ),
    },
    {
        "title": "Demonstracao do Sistema",
        "time": "3 minutos",
        "speech": (
            "Agora vou mostrar rapidamente o sistema funcionando, seguindo o fluxo real "
            "de uso. Primeiro, temos o login, onde o usuario acessa com suas credenciais. "
            "No perfil de professor, e possivel criar uma nova reserva escolhendo sala, "
            "data, horario e quantidade de alunos. O sistema apresenta a disponibilidade "
            "real dos ambientes e impede solicitacoes em horarios conflitantes. Em "
            "Minhas Reservas, o docente acompanha o status da solicitacao. No perfil "
            "administrador, aparecem as reservas pendentes, que podem ser aprovadas ou "
            "rejeitadas com justificativa. Tambem existe a gestao de salas e usuarios, "
            "alem do display publico, que pode ser exibido em uma TV ou tela da instituicao."
        ),
    },
    {
        "title": "Slide 7 - Consideracoes finais",
        "time": "1 minuto",
        "speech": (
            "Como conclusao, o GetLab entrega uma solucao pratica para um problema real "
            "da instituicao. Ele melhora a organizacao das reservas, reduz conflitos de "
            "horario e facilita o acompanhamento por professores e administradores. Como "
            "trabalhos futuros, o sistema pode evoluir com relatorios de utilizacao, "
            "notificacoes automaticas, novos niveis de permissao e uma versao mobile."
        ),
    },
    {
        "title": "Fechamento",
        "time": "15 segundos",
        "speech": (
            "Com isso, o GetLab fecha o ciclo completo de solicitacao, validacao "
            "administrativa, prevencao de conflitos e comunicacao publica da ocupacao "
            "dos laboratorios. Obrigado."
        ),
    },
]


def build_pdf():
    Path(OUTPUT).parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        rightMargin=1.7 * cm,
        leftMargin=1.7 * cm,
        topMargin=1.6 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#111111"),
        spaceAfter=8,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=14,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#555555"),
        spaceAfter=18,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#111111"),
        spaceAfter=4,
    )
    time_style = ParagraphStyle(
        "Time",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor("#193C6C"),
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.6,
        leading=15,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#222222"),
    )

    story = [
        Paragraph("Roteiro de Falas - Apresentacao GetLab", title_style),
        Paragraph("Duracao maxima sugerida: ate 10 minutos", subtitle_style),
    ]

    for item in slides:
        content = [
            Paragraph(item["title"], section_style),
            Paragraph(f"Tempo sugerido: {item['time']}", time_style),
            Spacer(1, 0.15 * cm),
            Paragraph(item["speech"], body_style),
        ]
        table = Table([[content]], colWidths=[17.2 * cm])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7F8FA")),
                    ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#DADDE3")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        story.append(table)
        story.append(Spacer(1, 0.32 * cm))

    doc.build(story)


if __name__ == "__main__":
    build_pdf()
