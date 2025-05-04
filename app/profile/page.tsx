import ProfileMain from "@/components/profile-main";

export default function Profile() {
  return (
    <div className="w-full flex flex-col overflow-hidden">
      <ProfileMain />
      <div className="bg-theme-secondary-muted p-4 w-full overflow-hidden flex flex-col gap-4">
        <div className="flex gap-2">
          <p className="text-xl">Furkan&apos;s</p>
          <p className="text-theme-primary text-xl">Display</p>
        </div>
        <div className="flex gap-8 overflow-x-auto overflow-y-hidden pb-4 snap-x w-full">
          {/* post */}
          <div className="bg-theme-primary-muted p-4 flex flex-col rounded-md min-w-[300px] max-w-md flex-shrink-0 snap-start">
            <div className="flex">
              <div className="rounded-full bg-theme-splitter w-12 h-12"></div>
              <div>
                <p>John Punishing</p>
                <p>@pgr</p>
              </div>
            </div>
            <div>
              <div className="rounded-md w-24 h-36 bg-theme-splitter float-right"></div>
              <p>
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Esse
                adipisci amet, doloremque architecto explicabo corporis
                assumenda vitae quibusdam libero? Rerum animi fuga autem nulla
                quo cum nihil, quisquam, maxime, minima sunt sapiente dolorum
                accusantium. Tenetur, ex accusantium dolore repellendus quas
                amet ratione eum magni officia vel libero sunt incidunt
                obcaecati nam provident! Architecto vero eaque placeat maxime,
                quibusdam qui similique ea laborum velit ipsa et pariatur. Ipsam
                rem officiis vitae voluptas aut a doloremque odit quaerat
                excepturi optio, possimus doloribus ea fugit tenetur maxime. Ab
                officiis accusamus porro qui aliquam! Animi voluptatum excepturi
                molestiae pariatur ut mollitia alias vero nobis!
              </p>
            </div>
          </div>
          {/* post */}
          <div className="bg-theme-primary-muted p-4 flex flex-col rounded-md min-w-[300px] max-w-md flex-shrink-0 snap-start">
            <div className="flex">
              <div className="rounded-full bg-theme-splitter w-12 h-12"></div>
              <div>
                <p>John Punishing</p>
                <p>@pgr</p>
              </div>
            </div>
            <div>
              <div className="rounded-md w-24 h-36 bg-theme-splitter float-right"></div>
              <p>
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Esse
                adipisci amet, doloremque architecto explicabo corporis
                assumenda vitae quibusdam libero? Rerum animi fuga autem nulla
                quo cum nihil, quisquam, maxime, minima sunt sapiente dolorum
                accusantium. Tenetur, ex accusantium dolore repellendus quas
                amet ratione eum magni officia vel libero sunt incidunt
                obcaecati nam provident! Architecto vero eaque placeat maxime,
                quibusdam qui similique ea laborum velit ipsa et pariatur. Ipsam
                rem officiis vitae voluptas aut a doloremque odit quaerat
                excepturi optio, possimus doloribus ea fugit tenetur maxime. Ab
                officiis accusamus porro qui aliquam! Animi voluptatum excepturi
                molestiae pariatur ut mollitia alias vero nobis!
              </p>
            </div>
          </div>
          {/* post */}
          <div className="bg-theme-primary-muted p-4 flex flex-col rounded-md min-w-[300px] max-w-md flex-shrink-0 snap-start">
            <div className="flex">
              <div className="rounded-full bg-theme-splitter w-12 h-12"></div>
              <div>
                <p>John Punishing</p>
                <p>@pgr</p>
              </div>
            </div>
            <div>
              <div className="rounded-md w-24 h-36 bg-theme-splitter float-right"></div>
              <p>
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Esse
                adipisci amet, doloremque architecto explicabo corporis
                assumenda vitae quibusdam libero? Rerum animi fuga autem nulla
                quo cum nihil, quisquam, maxime, minima sunt sapiente dolorum
                accusantium. Tenetur, ex accusantium dolore repellendus quas
                amet ratione eum magni officia vel libero sunt incidunt
                obcaecati nam provident! Architecto vero eaque placeat maxime,
                quibusdam qui similique ea laborum velit ipsa et pariatur. Ipsam
                rem officiis vitae voluptas aut a doloremque odit quaerat
                excepturi optio, possimus doloribus ea fugit tenetur maxime. Ab
                officiis accusamus porro qui aliquam! Animi voluptatum excepturi
                molestiae pariatur ut mollitia alias vero nobis!
              </p>
            </div>
          </div>
        </div>
      </div>
      <div></div>
    </div>
  );
}
