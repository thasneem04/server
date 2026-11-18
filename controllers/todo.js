import Todo from "../models/todoModel.js";

export const createTodo = async(req,res)=>{

    try{
    const todo = await Todo.create({
        task:req.body.task
    })

    res.status(201).json(todo);
}
catch(err)
{
res.status(500).json({
    message : err.message
})
}
}

export const getTodos = async(req,res)=>{

    try{
    const todos = await Todo.find();
    res.status(201).json(todos);
    }
    catch(err)
    {
        res.status(500).json({
            message:err.message
        })
    }
}


export const updateTodo = async(req,res)=>{
    try{
        const todo = await Todo.findByIdAndUpdate(
            req.params.id,

            {
                task : req.body.task
            },
            {
                new : true
            }
        );
        res.status(201).json(todo);
    }
    catch(err)
    {
        res.status(500).json({
           message:err.message
        })
    }
}
export const deleteTodo = async(req,res)=>{

    try{
    const todo = await Todo.findByIdAndDelete(
        req.params.id
    )
    res.status(201).json({
        message:"Deleted Successfully"
    })
}
catch(err)
{
    res.status(500).json({
        message:err.message
    })
}
}