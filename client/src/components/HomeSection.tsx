import { HomeSectionProps } from "../types/generalTypes"

const HomeSection:React.FC<HomeSectionProps>=({friends, token, currUserId, socket})=>{
    return(
        <section className="home-section-container">
            <div className="home-button-container">
                <button></button>
            </div>
        </section>
    )
}

export default HomeSection