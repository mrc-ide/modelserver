/*
 * This file is generated by jOOQ.
*/
package org.imperial.mrc.hint.db;


import javax.annotation.Generated;

import org.jooq.Sequence;
import org.jooq.impl.SequenceImpl;


/**
 * Convenience access to all sequences in public
 */
@Generated(
    value = {
        "http://www.jooq.org",
        "jOOQ version:3.10.5"
    },
    comments = "This class is generated by jOOQ"
)
@SuppressWarnings({ "all", "unchecked", "rawtypes" })
public class Sequences {

    /**
     * The sequence <code>public.project_id_seq</code>
     */
    public static final Sequence<Integer> PROJECT_ID_SEQ = new SequenceImpl<Integer>("project_id_seq", Public.PUBLIC, org.jooq.impl.SQLDataType.INTEGER.nullable(false));
}
