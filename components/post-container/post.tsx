import { ArrowBigDown, ArrowBigUp, UserPlus } from "lucide-react";

export default function Post() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div>
          <div className="flex items-center gap-4">
            <div className="rounded-full w-12 h-12 dark:bg-dark-splitter bg-light-splitter"></div>
            <div>
              <p>Lorem Ipsum</p>
              <p>@loremipsum</p>
            </div>
            <UserPlus className="rounded-full p-1 bg-dark-accent" size={28} />
          </div>
        </div>
      </div>
      <div>
        <p>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Temporibus
          nobis ullam a recusandae voluptate delectus quod libero et illum
          repellendus?
        </p>
      </div>
      <div className="w-full h-24 bg-dark-splitter rounded-md"></div>
      <div className="flex gap-4 text-dark-accent">
        <div className="flex items-center gap-0.5 h-8">
          <ArrowBigUp
            className="rounded-l-full p-1 bg-dark-primary-muted h-full"
            size={28}
          />
          <div className="p-1 px-2 bg-dark-primary-muted h-full">7</div>
          <ArrowBigDown
            className="rounded-r-full p-1 bg-dark-primary-muted h-full"
            size={28}
          />
        </div>
        <div className="p-1 px-2 rounded-full bg-dark-primary-muted">
          <p>7$</p>
        </div>
      </div>
    </div>
  );
}
