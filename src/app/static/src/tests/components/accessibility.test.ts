import {emptyState} from "../../app/root";
import Vuex from "vuex";
import Accessibility from "../../app/components/Accessibility.vue"

import registerTranslations from "../../app/store/translations/registerTranslations";
import {shallowMount} from "@vue/test-utils";
import {expectTranslated} from "../testHelpers";
import {actions} from "../../app/store/root/actions";
import {mutations} from "../../app/store/root/mutations";
import {Language} from "../../app/store/translations/locales";

describe(`accessibility`, () =>{
    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            actions: actions,
            mutations: mutations
        });
        registerTranslations(store);
        return store;
    };

    const getWrapper = () => {
        return shallowMount(Accessibility,
            {
                store: createStore()
            })
    }

    it(`renders accessibility tags as expected`, () => {
        const rendered = getWrapper()
        expect(rendered.find("#accessibility-content")
            .find("h1").text()).toBe("Accessibility on Naomi")

        const h2 = rendered.find("#accessibility-content").findAll("h2")

        expect(h2.at(0).text()).toBe("How accessible the website is")
        expect(h2.at(1).text()).toBe("What we do about known issues")
        expect(h2.at(2).text()).toBe("Technical information about this website’s accessibility")
        expect(h2.at(3).text()).toBe("Reporting accessibility issues")
        expect(h2.at(4).text()).toBe("Enforcement procedure")
        expect(h2.at(5).text()).toBe("How we test this website")
        expect(h2.at(6).text()).toBe("Last updated")

        const paragraphs = rendered.find("#accessibility-content").findAll("p")
        expect(paragraphs.length).toBe(12)
        expect(paragraphs.at(11).text()).toBe("This statement was prepared on 24 February 2021." +
            " It was last updated on 26 February 2021.")
    })

    it(`renders accessibility h1 and h2 tags as expected`, () => {
        const rendered = getWrapper()
        rendered.vm.$store.state.language = Language.fr

        expect(rendered.find("#accessibility-content")
            .find("h1").text()).toBe("Accessibilité sur Naomi")

        const h2 = rendered.find("#accessibility-content").findAll("h2")
        expect(h2.at(0).text()).toBe("Accessibilité du site Web")
        expect(h2.at(1).text()).toBe("Traitement des problèmes connus")
        expect(h2.at(2).text()).toBe("Informations techniques sur l'accessibilité de ce site Web")
        expect(h2.at(3).text()).toBe("Signalement des problèmes d’accessibilité")
        expect(h2.at(4).text()).toBe("Procédure d'exécution")
        expect(h2.at(5).text()).toBe("Comment nous testons ce site Web")
        expect(h2.at(6).text()).toBe("Dernière mise à jour")

        const paragraph = rendered.find("#accessibility-content").findAll("p")
        expect(paragraph.at(11).text()).toBe("Cette déclaration a été préparée " +
            "le 24 février 2021. Elle a été mise à jour pour la dernière fois le 26 février 2021.")
    })

    it(`renders accessibility purpose list tags as expected in French`, () => {
        const rendered = getWrapper()
        rendered.vm.$store.state.language = Language.fr

        const li = rendered.find("#accessibility-content").find("#purpose").findAll("ul li")
        expect(li.length).toBe(3)
        expect(li.at(0).text()).toBe("Redimensionner votre fenêtre avec le contenu reformaté de manière appropriée")
        expect(li.at(1).text()).toBe("Ajuster la taille de votre texte sans pour autant que le site ne devienne moins utilisable")
        expect(li.at(2).text()).toBe("Lire facilement le texte grâce à un contraste suffisant entre les éléments de premier plan et les éléments d’arrière-plan")
    })

    it(`renders accessibility example list tags as expected in French`, () => {
        const rendered = getWrapper()
        rendered.vm.$store.state.language = Language.fr

        const li = rendered.find("#accessibility-content").find("#example").findAll("ul li")
        expect(li.length).toBe(6)
        expect(li.at(0).text()).toBe("Il se peut qu’il ne soit pas entièrement navigable par le clavier")
        expect(li.at(1).text()).toBe("Certains graphiques et tableaux peuvent ne pas être interprétés correctement par les lecteurs d’écran")
        expect(li.at(2).text()).toBe("Certains éléments de formulaire peuvent ne pas comporter de noms ou d’étiquettes de description")
        expect(li.at(3).text()).toBe("Certaines phrases peuvent ne pas avoir été traduites correctement")
        expect(li.at(4).text()).toBe("Le contraste de couleurs peut ne pas s’avérer suffisant pour certains éléments de formulaire")
        expect(li.at(5).text()).toBe("Certaines pages peuvent ne pas offrir la possibilité d’ignorer la navigation et d’accéder directement au contenu")
    })

    it(`renders accessibility purpose list tags as expected in English`, () => {
        const rendered = getWrapper()

        const li = rendered.find("#accessibility-content").find("#purpose").findAll("ul li")
        expect(li.length).toBe(3)
        expect(li.at(0).text()).toBe("Resize your window with content being reformatted appropriately")
        expect(li.at(1).text()).toBe("Adjust your text size without the site becoming less usable")
        expect(li.at(2).text()).toBe("Read text easily due to sufficient contrast between foreground and background elements")
    })

    it(`renders accessibility example list tags as expected in English`, () => {
        const rendered = getWrapper()
        const li = rendered.find("#accessibility-content").find("#example").findAll("ul li")
        expect(li.length).toBe(6)
        expect(li.at(0).text()).toBe("It may not be entirely navigable by keyboard")
        expect(li.at(1).text()).toBe("Some charts and tables may not be correctly interpreted by screen readers")
        expect(li.at(2).text()).toBe("Some form elements may lack descriptive names or labels")
        expect(li.at(3).text()).toBe("Some sentences may not have been correctly translated")
        expect(li.at(4).text()).toBe("Some form elements may lack sufficient color contrasts")
        expect(li.at(5).text()).toBe("Some pages may not have the option to skip navigation and jump to the content")
    })
})
